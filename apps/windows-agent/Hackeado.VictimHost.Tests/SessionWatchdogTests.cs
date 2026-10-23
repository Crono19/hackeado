using Hackeado.VictimHost.Safety;

namespace Hackeado.VictimHost.Tests;

public sealed class SessionWatchdogTests
{
    [Fact]
    public void ExpiresOnlyWhenArmedLeaseEnds()
    {
        using var watchdog = new SessionWatchdog(() => { });
        Assert.False(watchdog.IsExpired(10_000));
        watchdog.Pulse(20_000);
        Assert.False(watchdog.IsExpired(19_999));
        Assert.True(watchdog.IsExpired(20_000));
        watchdog.Disarm();
        Assert.False(watchdog.IsExpired(30_000));
    }
}
