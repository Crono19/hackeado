using System.Runtime.InteropServices;

namespace Hackeado.VictimHost.Input;

public sealed class KeyboardController
{
    private const uint KeyUp = 0x0002;
    private const uint Unicode = 0x0004;
    private readonly Dictionary<string, ushort> _pressed = new(StringComparer.Ordinal);

    public void Down(
        string code,
        string key,
        bool repeat,
        bool altKey,
        bool ctrlKey,
        bool shiftKey,
        bool metaKey)
    {
        EnsureAllowed(code, key, altKey, ctrlKey, shiftKey, metaKey);
        if (_pressed.ContainsKey(code) && !repeat) return;
        if (!TryVirtualKey(code, key, out var virtualKey))
        {
            if (key.Length == 1 && !ctrlKey && !altKey && !metaKey) SendUnicodeCharacter(key[0]);
            return;
        }
        SendKey(virtualKey, false);
        _pressed[code] = virtualKey;
    }

    public void Up(string code)
    {
        if (!_pressed.Remove(code, out var virtualKey)) return;
        SendKey(virtualKey, true);
    }

    public void ExecuteShortcut(string shortcut, string? text = null)
    {
        switch (shortcut)
        {
            case "start": Tap(0x5B); break;
            case "alt-tab": Chord([0x12], 0x09); break;
            case "escape": Tap(0x1B); break;
            case "enter": Tap(0x0D); break;
            case "select-all": Chord([0x11], 0x41); break;
            case "copy": Chord([0x11], 0x43); break;
            case "undo": Chord([0x11], 0x5A); break;
            case "close-window": Chord([0x12], 0x73); break;
            case "show-desktop": Chord([0x5B], 0x44); break;
            case "paste-text":
                if (string.IsNullOrEmpty(text) || text.Length > 500)
                    throw new InvalidOperationException("shortcut_text_invalid");
                foreach (var character in text) SendUnicodeCharacter(character);
                break;
            default: throw new InvalidOperationException("shortcut_not_allowed");
        }
    }

    public void ReleaseAll()
    {
        foreach (var virtualKey in _pressed.Values.Reverse()) SendKey(virtualKey, true);
        _pressed.Clear();
    }

    public static bool IsAllowedCode(string code) =>
        code is "Backspace" or "Tab" or "Enter" or "ShiftLeft" or "ShiftRight" or
            "ControlLeft" or "ControlRight" or "AltLeft" or "AltRight" or "CapsLock" or
            "Escape" or "Space" or "PageUp" or "PageDown" or "End" or "Home" or
            "ArrowLeft" or "ArrowUp" or "ArrowRight" or "ArrowDown" or "Insert" or
            "Delete" or "Semicolon" or "Equal" or "Comma" or "Minus" or "Period" or
            "Slash" or "Backquote" or "BracketLeft" or "Backslash" or "BracketRight" or
            "Quote" or "IntlBackslash" or "IntlRo" or "IntlYen" ||
        code.Length == 4 && code.StartsWith("Key", StringComparison.Ordinal) && code[3] is >= 'A' and <= 'Z' ||
        code.Length == 6 && code.StartsWith("Digit", StringComparison.Ordinal) && code[5] is >= '0' and <= '9' ||
        code.StartsWith("Numpad", StringComparison.Ordinal) && code.Length <= 16 ||
        code.StartsWith('F') && int.TryParse(code[1..], out var function) && function is >= 1 and <= 11;

    private static void EnsureAllowed(
        string code,
        string key,
        bool altKey,
        bool ctrlKey,
        bool shiftKey,
        bool metaKey)
    {
        if (!IsAllowedCode(code) || metaKey || code.StartsWith("Meta", StringComparison.Ordinal))
            throw new InvalidOperationException("keyboard_code_blocked");
        if (ctrlKey && altKey && code is "Delete" or "Escape")
            throw new InvalidOperationException("keyboard_combination_blocked");
        if (ctrlKey && shiftKey && code == "Escape")
            throw new InvalidOperationException("keyboard_combination_blocked");
        if (altKey && code == "F4")
            throw new InvalidOperationException("use_close_window_shortcut");
        if (key.Length > 32) throw new InvalidOperationException("keyboard_key_invalid");
    }

    private static bool TryVirtualKey(string code, string key, out ushort virtualKey)
    {
        virtualKey = code switch
        {
            "Backspace" => 0x08, "Tab" => 0x09, "Enter" => 0x0D, "ShiftLeft" or "ShiftRight" => 0x10,
            "ControlLeft" or "ControlRight" => 0x11, "AltLeft" or "AltRight" => 0x12,
            "CapsLock" => 0x14, "Escape" => 0x1B, "Space" => 0x20, "PageUp" => 0x21,
            "PageDown" => 0x22, "End" => 0x23, "Home" => 0x24, "ArrowLeft" => 0x25,
            "ArrowUp" => 0x26, "ArrowRight" => 0x27, "ArrowDown" => 0x28, "Insert" => 0x2D,
            "Delete" => 0x2E, "Semicolon" => 0xBA, "Equal" => 0xBB, "Comma" => 0xBC,
            "Minus" => 0xBD, "Period" => 0xBE, "Slash" => 0xBF, "Backquote" => 0xC0,
            "BracketLeft" => 0xDB, "Backslash" or "IntlBackslash" => 0xDC,
            "BracketRight" => 0xDD, "Quote" => 0xDE,
            _ => 0
        };
        if (virtualKey != 0) return true;
        if (code.Length == 4 && code.StartsWith("Key", StringComparison.Ordinal))
            virtualKey = code[3];
        else if (code.Length == 6 && code.StartsWith("Digit", StringComparison.Ordinal))
            virtualKey = code[5];
        else if (code.StartsWith('F') && ushort.TryParse(code[1..], out var function) && function is >= 1 and <= 11)
            virtualKey = (ushort)(0x6F + function);
        else if (key.Length == 1)
        {
            var mapped = VkKeyScan(key[0]);
            if (mapped != -1) virtualKey = (ushort)(mapped & 0xFF);
        }
        return virtualKey != 0;
    }

    private static void Tap(ushort key)
    {
        SendKey(key, false);
        SendKey(key, true);
    }

    private static void Chord(ushort[] modifiers, ushort key)
    {
        foreach (var modifier in modifiers) SendKey(modifier, false);
        Tap(key);
        foreach (var modifier in modifiers.Reverse()) SendKey(modifier, true);
    }

    private static void SendUnicodeCharacter(char character)
    {
        SendInputChecked([
            KeyboardInput(0, character, Unicode),
            KeyboardInput(0, character, Unicode | KeyUp)
        ]);
    }

    private static void SendKey(ushort virtualKey, bool up) =>
        SendInputChecked([KeyboardInput(virtualKey, 0, up ? KeyUp : 0)]);

    private static INPUT KeyboardInput(ushort virtualKey, ushort scanCode, uint flags) => new()
    {
        type = 1,
        union = new InputUnion
        {
            keyboard = new KEYBDINPUT { wVk = virtualKey, wScan = scanCode, dwFlags = flags }
        }
    };

    private static void SendInputChecked(INPUT[] inputs)
    {
        if (SendInput((uint)inputs.Length, inputs, Marshal.SizeOf<INPUT>()) != (uint)inputs.Length)
            throw new InvalidOperationException("send_input_failed");
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT { public uint type; public InputUnion union; }
    [StructLayout(LayoutKind.Explicit)]
    private struct InputUnion { [FieldOffset(0)] public KEYBDINPUT keyboard; }
    [StructLayout(LayoutKind.Sequential)]
    private struct KEYBDINPUT
    {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public nint dwExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint numberOfInputs, INPUT[] inputs, int sizeOfInputStructure);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern short VkKeyScan(char character);
}
