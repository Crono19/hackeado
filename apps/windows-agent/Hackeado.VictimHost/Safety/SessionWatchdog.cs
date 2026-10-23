namespace Hackeado.VictimHost.Safety;

public sealed class SessionWatchdog : IDisposable
{
    private readonly System.Threading.Timer _timer;
    private readonly Action _onExpired;
    private long _expiresAt;
    private int _armed;

    public SessionWatchdog(Action onExpired)
    {
        _onExpired = onExpired;
        _timer = new System.Threading.Timer(Check, null, 500, 500);
    }

    public void Pulse(long expiresAt)
    {
        Interlocked.Exchange(ref _expiresAt, expiresAt);
        Interlocked.Exchange(ref _armed, 1);
    }

    public void Disarm()
    {
        Interlocked.Exchange(ref _armed, 0);
        Interlocked.Exchange(ref _expiresAt, 0);
    }

    public bool IsExpired(long now) =>
        Volatile.Read(ref _armed) == 1 && now >= Volatile.Read(ref _expiresAt);

    private void Check(object? state)
    {
        if (!IsExpired(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())) return;
        if (Interlocked.Exchange(ref _armed, 0) == 1) _onExpired();
    }

    public void Dispose() => _timer.Dispose();
}
