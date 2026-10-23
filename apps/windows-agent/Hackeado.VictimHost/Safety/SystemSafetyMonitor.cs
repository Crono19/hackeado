using System.Runtime.InteropServices;
using System.Windows.Interop;

namespace Hackeado.VictimHost.Safety;

public sealed class SystemSafetyMonitor : IDisposable
{
    private const int WmQueryEndSession = 0x0011;
    private const int WmPowerBroadcast = 0x0218;
    private const int WmWtsSessionChange = 0x02B1;
    private const int PowerSuspend = 0x0004;
    private const int SessionLock = 0x0007;
    private const int SessionLogoff = 0x0006;
    private const uint NotifyThisSession = 0;
    private readonly nint _handle;
    private readonly HwndSource _source;
    private readonly Action<string> _onUnsafeState;

    public SystemSafetyMonitor(System.Windows.Window window, Action<string> onUnsafeState)
    {
        _onUnsafeState = onUnsafeState;
        _handle = new WindowInteropHelper(window).Handle;
        _source = HwndSource.FromHwnd(_handle) ?? throw new InvalidOperationException("window_handle_missing");
        _source.AddHook(Hook);
        if (!WTSRegisterSessionNotification(_handle, NotifyThisSession))
            throw new InvalidOperationException("session_monitor_unavailable");
    }

    private nint Hook(nint hwnd, int message, nint wParam, nint lParam, ref bool handled)
    {
        if (message == WmQueryEndSession) _onUnsafeState("windows_shutdown");
        if (message == WmPowerBroadcast && wParam.ToInt32() == PowerSuspend)
            _onUnsafeState("windows_suspend");
        if (message == WmWtsSessionChange && wParam.ToInt32() is SessionLock or SessionLogoff)
            _onUnsafeState("windows_lock");
        return 0;
    }

    public void Dispose()
    {
        WTSUnRegisterSessionNotification(_handle);
        _source.RemoveHook(Hook);
    }

    [DllImport("wtsapi32.dll", SetLastError = true)]
    private static extern bool WTSRegisterSessionNotification(nint handle, uint flags);

    [DllImport("wtsapi32.dll")]
    private static extern bool WTSUnRegisterSessionNotification(nint handle);
}
