using System.Text.Json;
using Hackeado.VictimHost.Input;

namespace Hackeado.VictimHost.Bridge;

public sealed record RemotePointerPacket(
    string Type,
    string SessionId,
    string LeaseId,
    long Sequence,
    long SentAt,
    double X,
    double Y,
    string? Button,
    double DeltaX,
    double DeltaY);

public sealed record RemoteKeyboardPacket(
    string Type,
    string SessionId,
    string LeaseId,
    long Sequence,
    long SentAt,
    string Code,
    string Key,
    bool Repeat,
    bool AltKey,
    bool CtrlKey,
    bool ShiftKey,
    bool MetaKey);

public sealed record RemoteShortcutPacket(
    string Type,
    string SessionId,
    string LeaseId,
    long Sequence,
    long SentAt,
    string Shortcut,
    string? Text);

public static class NativeMessageValidator
{
    private static readonly HashSet<string> PointerTypes =
        ["pointer.move", "pointer.down", "pointer.up", "pointer.wheel"];
    private static readonly HashSet<string> Buttons =
        ["left", "right", "middle", "back", "forward"];
    private static readonly HashSet<string> Shortcuts =
        ["start", "alt-tab", "escape", "enter", "select-all", "copy", "paste-text", "undo", "close-window", "show-desktop"];

    public static RemotePointerPacket ParsePointer(JsonElement payload)
    {
        var type = RequiredString(payload, "type", 40);
        if (!PointerTypes.Contains(type)) throw new InvalidOperationException("message_type_unsupported");
        var version = payload.GetProperty("version").GetInt32();
        if (version != 1) throw new InvalidOperationException("protocol_version_invalid");
        var x = payload.GetProperty("x").GetDouble();
        var y = payload.GetProperty("y").GetDouble();
        if (x is < 0 or > 1 || y is < 0 or > 1) throw new InvalidOperationException("coordinates_invalid");
        var button = payload.TryGetProperty("button", out var buttonValue) ? buttonValue.GetString() : null;
        if ((type is "pointer.down" or "pointer.up") && (button is null || !Buttons.Contains(button)))
            throw new InvalidOperationException("pointer_button_invalid");
        var deltaX = payload.TryGetProperty("deltaX", out var dx) ? dx.GetDouble() : 0;
        var deltaY = payload.TryGetProperty("deltaY", out var dy) ? dy.GetDouble() : 0;
        if (Math.Abs(deltaX) > 10_000 || Math.Abs(deltaY) > 10_000)
            throw new InvalidOperationException("wheel_delta_invalid");
        return new RemotePointerPacket(
            type,
            RequiredString(payload, "sessionId", 80),
            RequiredString(payload, "leaseId", 100),
            payload.GetProperty("sequence").GetInt64(),
            payload.GetProperty("sentAt").GetInt64(),
            x,
            y,
            button,
            deltaX,
            deltaY);
    }

    public static RemoteKeyboardPacket ParseKeyboard(JsonElement payload)
    {
        var type = RequiredString(payload, "type", 40);
        if (type is not ("keyboard.down" or "keyboard.up"))
            throw new InvalidOperationException("message_type_unsupported");
        var common = ParseCommon(payload);
        var code = RequiredString(payload, "code", 64);
        var key = payload.GetProperty("key").GetString() ?? "";
        if (!KeyboardController.IsAllowedCode(code) || key.Length > 32)
            throw new InvalidOperationException("keyboard_code_blocked");
        return new RemoteKeyboardPacket(
            type, common.SessionId, common.LeaseId, common.Sequence, common.SentAt,
            code, key, payload.GetProperty("repeat").GetBoolean(),
            payload.GetProperty("altKey").GetBoolean(), payload.GetProperty("ctrlKey").GetBoolean(),
            payload.GetProperty("shiftKey").GetBoolean(), payload.GetProperty("metaKey").GetBoolean());
    }

    public static RemoteShortcutPacket ParseShortcut(JsonElement payload)
    {
        var type = RequiredString(payload, "type", 40);
        if (type != "keyboard.shortcut") throw new InvalidOperationException("message_type_unsupported");
        var common = ParseCommon(payload);
        var shortcut = RequiredString(payload, "shortcut", 40);
        if (!Shortcuts.Contains(shortcut)) throw new InvalidOperationException("shortcut_not_allowed");
        var text = payload.TryGetProperty("text", out var textValue) ? textValue.GetString() : null;
        if (text?.Length > 500) throw new InvalidOperationException("shortcut_text_invalid");
        return new RemoteShortcutPacket(type, common.SessionId, common.LeaseId, common.Sequence, common.SentAt, shortcut, text);
    }

    public static (string SessionId, string LeaseId, long Sequence, long SentAt) ParseCommon(JsonElement payload)
    {
        if (payload.GetProperty("version").GetInt32() != 1)
            throw new InvalidOperationException("protocol_version_invalid");
        return (
            RequiredString(payload, "sessionId", 80),
            RequiredString(payload, "leaseId", 100),
            payload.GetProperty("sequence").GetInt64(),
            payload.GetProperty("sentAt").GetInt64());
    }

    private static string RequiredString(JsonElement element, string property, int max)
    {
        var value = element.GetProperty(property).GetString();
        if (string.IsNullOrWhiteSpace(value) || value.Length > max)
            throw new InvalidOperationException($"{property}_invalid");
        return value;
    }
}
