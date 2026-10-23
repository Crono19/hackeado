using System.Text.Json;
using Hackeado.VictimHost.Bridge;

namespace Hackeado.VictimHost.Tests;

public sealed class NativeMessageValidatorTests
{
    [Fact]
    public void AcceptsKnownPointerPacket()
    {
        using var document = JsonDocument.Parse("""
        {
          "version": 1,
          "type": "pointer.down",
          "sessionId": "session-01",
          "leaseId": "0123456789abcdef",
          "sequence": 7,
          "sentAt": 10000,
          "x": 0.5,
          "y": 1,
          "button": "right"
        }
        """);
        var packet = NativeMessageValidator.ParsePointer(document.RootElement);
        Assert.Equal("right", packet.Button);
        Assert.Equal(7, packet.Sequence);
    }

    [Theory]
    [InlineData("keyboard.down", 0.5)]
    [InlineData("pointer.move", 1.1)]
    public void RejectsUnknownTypeAndOutOfRangeCoordinates(string type, double x)
    {
        var json = $$"""
        {
          "version": 1,
          "type": "{{type}}",
          "sessionId": "session-01",
          "leaseId": "0123456789abcdef",
          "sequence": 7,
          "sentAt": 10000,
          "x": {{x.ToString(System.Globalization.CultureInfo.InvariantCulture)}},
          "y": 0.5
        }
        """;
        using var document = JsonDocument.Parse(json);
        Assert.Throws<InvalidOperationException>(() => NativeMessageValidator.ParsePointer(document.RootElement));
    }

    [Fact]
    public void AcceptsSpanishSymbolAndModifierKeyboardPacket()
    {
        using var document = JsonDocument.Parse("""
        {
          "version": 1, "type": "keyboard.down", "sessionId": "session-01",
          "leaseId": "0123456789abcdef", "sequence": 8, "sentAt": 10000,
          "code": "Semicolon", "key": "Ñ", "repeat": false,
          "altKey": false, "ctrlKey": false, "shiftKey": true, "metaKey": false
        }
        """);
        var packet = NativeMessageValidator.ParseKeyboard(document.RootElement);
        Assert.Equal("Ñ", packet.Key);
        Assert.True(packet.ShiftKey);
    }

    [Theory]
    [InlineData("F12")]
    [InlineData("MetaLeft")]
    [InlineData("MediaPlayPause")]
    public void RejectsBlockedKeyboardCodes(string code)
    {
        var json = $$"""
        {
          "version": 1, "type": "keyboard.down", "sessionId": "session-01",
          "leaseId": "0123456789abcdef", "sequence": 8, "sentAt": 10000,
          "code": "{{code}}", "key": "x", "repeat": false,
          "altKey": false, "ctrlKey": false, "shiftKey": false, "metaKey": false
        }
        """;
        using var document = JsonDocument.Parse(json);
        Assert.Throws<InvalidOperationException>(() => NativeMessageValidator.ParseKeyboard(document.RootElement));
    }

    [Theory]
    [InlineData("start")]
    [InlineData("alt-tab")]
    [InlineData("escape")]
    [InlineData("enter")]
    public void AcceptsExplicitShortcutAllowlist(string shortcut)
    {
        var json = $$"""
        {
          "version": 1, "type": "keyboard.shortcut", "sessionId": "session-01",
          "leaseId": "0123456789abcdef", "sequence": 9, "sentAt": 10000,
          "shortcut": "{{shortcut}}"
        }
        """;
        using var document = JsonDocument.Parse(json);
        Assert.Equal(shortcut, NativeMessageValidator.ParseShortcut(document.RootElement).Shortcut);
    }
}
