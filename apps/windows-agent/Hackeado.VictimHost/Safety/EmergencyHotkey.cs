using System.Runtime.InteropServices;
using System.Windows.Interop;

namespace Hackeado.VictimHost.Safety;

public sealed class EmergencyHotkey : IDisposable
{
    private const int HotkeyId = 0x4841;
    private const int WmHotkey = 0x0312;
    private const uint ModControl = 0x0002;
    private const uint ModShift = 0x0004;
    private const uint VkF12 = 0x7B;
    private readonly nint _handle;
    private readonly Action _onPressed;
    private readonly HwndSource _source;

    public EmergencyHotkey(System.Windows.Window window, Action onPressed)
    {
        _onPressed = onPressed;
        _handle = new WindowInteropHelper(window).Handle;
        _source = HwndSource.FromHwnd(_handle) ?? throw new InvalidOperationException("window_handle_missing");
        _source.AddHook(Hook);
        if (!RegisterHotKey(_handle, HotkeyId, ModControl | ModShift, VkF12))
            throw new InvalidOperationException("emergency_hotkey_unavailable");
    }

    private nint Hook(nint hwnd, int message, nint wParam, nint lParam, ref bool handled)
    {
        if (message != WmHotkey || wParam.ToInt32() != HotkeyId) return 0;
        handled = true;
        _onPressed();
        return 0;
    }

    public void Dispose()
    {
        UnregisterHotKey(_handle, HotkeyId);
        _source.RemoveHook(Hook);
    }

    [DllImport("user32.dll")]
    private static extern bool RegisterHotKey(nint handle, int id, uint modifiers, uint virtualKey);

    [DllImport("user32.dll")]
    private static extern bool UnregisterHotKey(nint handle, int id);
}
