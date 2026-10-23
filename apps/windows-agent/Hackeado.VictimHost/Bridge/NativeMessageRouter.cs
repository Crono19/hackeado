using System.Runtime.InteropServices;
using System.Text.Json;
using Hackeado.VictimHost.Configuration;
using Hackeado.VictimHost.Input;
using Hackeado.VictimHost.Safety;
using Hackeado.VictimHost.Telemetry;

namespace Hackeado.VictimHost.Bridge;

public sealed class NativeMessageRouter : IDisposable
{
    private const string Version = "1.0.0-rc.1";
    private readonly AgentConfiguration _configuration;
    private readonly PointerController _pointer;
    private readonly KeyboardController _keyboard;
    private readonly Action<object> _send;
    private readonly AgentLogger _logger;
    private readonly InputSafetyPolicy _policy = new();
    private readonly SessionWatchdog _watchdog;
    private readonly Action<bool, string> _controlStateChanged;
    private bool _hasContext;

    public NativeMessageRouter(
        AgentConfiguration configuration,
        PointerController pointer,
        KeyboardController keyboard,
        Action<object> send,
        AgentLogger logger,
        Action<bool, string> controlStateChanged)
    {
        _configuration = configuration;
        _pointer = pointer;
        _keyboard = keyboard;
        _send = send;
        _logger = logger;
        _controlStateChanged = controlStateChanged;
        _watchdog = new SessionWatchdog(() => Stop("timeout"));
    }

    public void Handle(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 8 });
            var root = document.RootElement;
            var type = root.GetProperty("type").GetString();
            switch (type)
            {
                case "bridge.probe":
                    SendReady();
                    break;
                case "control.context":
                    var expiresAt = root.GetProperty("expiresAt").GetInt64();
                    _policy.SetContext(
                        root.GetProperty("sessionId").GetString() ?? "",
                        root.GetProperty("leaseId").GetString() ?? "",
                        expiresAt,
                        root.GetProperty("consentGranted").GetBoolean());
                    _watchdog.Pulse(expiresAt);
                    _hasContext = true;
                    var active = root.TryGetProperty("active", out var activeValue) && activeValue.GetBoolean();
                    var operatorName = root.TryGetProperty("operatorName", out var operatorValue)
                        ? operatorValue.GetString() ?? "OPERADOR AUTORIZADO"
                        : "OPERADOR AUTORIZADO";
                    _controlStateChanged(active, operatorName);
                    _logger.Write("control_context_set");
                    break;
                case "control.clear":
                    var reason = root.TryGetProperty("reason", out var reasonValue)
                        ? reasonValue.GetString() ?? "victim"
                        : "victim";
                    Stop(reason is "victim" or "attacker" or "coordinator" or "timeout" or "network" or "emergency"
                        ? reason
                        : "victim", false);
                    break;
                case "remote.input":
                    HandleInput(root.GetProperty("payload"));
                    break;
                default:
                    throw new InvalidOperationException("message_type_unknown");
            }
        }
        catch (Exception exception) when (exception is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            _logger.Write("bridge_message_rejected", exception.Message);
            _send(new { type = "native.input.rejected", reason = exception.Message });
        }
    }

    public void Stop(string reason, bool notifyWeb = true)
    {
        try { _pointer.ReleaseAll(); }
        catch (Exception exception) { _logger.Write("pointer_release_failed", exception.GetType().Name); }
        try { _keyboard.ReleaseAll(); }
        catch (Exception exception) { _logger.Write("keyboard_release_failed", exception.GetType().Name); }
        _policy.Clear();
        _watchdog.Disarm();
        var hadContext = _hasContext;
        _hasContext = false;
        _controlStateChanged(false, "");
        if (notifyWeb && hadContext) _send(new { type = "native.stopped", reason });
        _logger.Write("control_stopped", reason);
    }

    private void HandleInput(JsonElement payload)
    {
        var type = payload.GetProperty("type").GetString() ?? "";
        if (type.StartsWith("pointer.", StringComparison.Ordinal))
        {
            HandlePointer(payload);
            return;
        }
        if (type is "keyboard.down" or "keyboard.up")
        {
            var packet = NativeMessageValidator.ParseKeyboard(payload);
            EnsureAccepted(packet.SessionId, packet.LeaseId, packet.Sequence, packet.SentAt, packet.Type);
            if (packet.Type == "keyboard.down")
                _keyboard.Down(packet.Code, packet.Key, packet.Repeat, packet.AltKey, packet.CtrlKey, packet.ShiftKey, packet.MetaKey);
            else _keyboard.Up(packet.Code);
            Accept(packet.Sequence);
            return;
        }
        if (type == "keyboard.shortcut")
        {
            var packet = NativeMessageValidator.ParseShortcut(payload);
            EnsureAccepted(packet.SessionId, packet.LeaseId, packet.Sequence, packet.SentAt, packet.Type);
            _keyboard.ExecuteShortcut(packet.Shortcut, packet.Text);
            Accept(packet.Sequence);
            return;
        }
        if (type == "keyboard.releaseAll")
        {
            var packet = NativeMessageValidator.ParseCommon(payload);
            EnsureAccepted(packet.SessionId, packet.LeaseId, packet.Sequence, packet.SentAt, type);
            _keyboard.ReleaseAll();
            Accept(packet.Sequence);
            return;
        }
        throw new InvalidOperationException("message_type_unsupported");
    }

    private void HandlePointer(JsonElement payload)
    {
        var packet = NativeMessageValidator.ParsePointer(payload);
        EnsureAccepted(packet.SessionId, packet.LeaseId, packet.Sequence, packet.SentAt, packet.Type);
        switch (packet.Type)
        {
            case "pointer.move": _pointer.Move(packet.X, packet.Y); break;
            case "pointer.down": _pointer.Down(packet.X, packet.Y, packet.Button!); break;
            case "pointer.up": _pointer.Up(packet.X, packet.Y, packet.Button!); break;
            case "pointer.wheel": _pointer.Wheel(packet.X, packet.Y, packet.DeltaX, packet.DeltaY); break;
        }
        Accept(packet.Sequence);
    }

    private void EnsureAccepted(string sessionId, string leaseId, long sequence, long sentAt, string type)
    {
        if (!_policy.Accept(sessionId, leaseId, sequence, sentAt, type, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()))
            throw new InvalidOperationException("input_policy_rejected");
    }

    private void Accept(long sequence) => _send(new { type = "native.input.accepted", sequence });

    private void SendReady()
    {
        var width = GetSystemMetrics(78);
        var height = GetSystemMetrics(79);
        _send(new
        {
            type = "native.ready",
            registration = new
            {
                deviceId = _configuration.DeviceId,
                agentKey = _configuration.AgentKey,
                version = Version,
                capabilities = new
                {
                    nativeBridge = true,
                    desktopCapture = true,
                    pointer = true,
                    keyboard = true,
                    wheel = true,
                    emergencyHotkey = true,
                    displayCount = GetSystemMetrics(80),
                    screenWidth = width,
                    screenHeight = height,
                    dpiScale = DetectDpiScale()
                }
            }
        });
    }

    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int index);

    [DllImport("user32.dll")]
    private static extern uint GetDpiForSystem();

    private static double DetectDpiScale()
    {
        try
        {
            return Math.Clamp(GetDpiForSystem() / 96.0, 0.5, 4.0);
        }
        catch (EntryPointNotFoundException)
        {
            return 1.0;
        }
    }

    public void Dispose() => _watchdog.Dispose();
}
