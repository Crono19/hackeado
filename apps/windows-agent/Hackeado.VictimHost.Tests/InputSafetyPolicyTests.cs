using Hackeado.VictimHost.Input;

namespace Hackeado.VictimHost.Tests;

public sealed class InputSafetyPolicyTests
{
    [Fact]
    public void RejectsWrongLeaseExpiredAndRepeatedSequences()
    {
        var policy = new InputSafetyPolicy();
        policy.SetContext("session", "0123456789abcdef", 20_000, true);
        Assert.True(policy.Accept("session", "0123456789abcdef", 1, 10_000, "pointer.move", 10_000));
        Assert.False(policy.Accept("session", "0123456789abcdef", 1, 10_001, "pointer.move", 10_001));
        Assert.False(policy.Accept("session", "wrong-lease-00000", 2, 10_002, "pointer.move", 10_002));
        Assert.False(policy.Accept("session", "0123456789abcdef", 2, 20_000, "pointer.move", 20_000));
    }

    [Fact]
    public void ClearRevokesImmediately()
    {
        var policy = new InputSafetyPolicy();
        policy.SetContext("session", "0123456789abcdef", 20_000, true);
        policy.Clear();
        Assert.False(policy.Accept("session", "0123456789abcdef", 1, 10_000, "pointer.down", 10_000));
    }

    [Fact]
    public void LeaseRenewalDoesNotResetSequenceProtection()
    {
        var policy = new InputSafetyPolicy();
        policy.SetContext("session", "0123456789abcdef", 20_000, true);
        Assert.True(policy.Accept("session", "0123456789abcdef", 12, 10_000, "pointer.move", 10_000));
        policy.SetContext("session", "0123456789abcdef", 30_000, true);
        Assert.False(policy.Accept("session", "0123456789abcdef", 12, 10_100, "pointer.move", 10_100));
    }

    [Fact]
    public void RejectsStaleFutureAndFloodedPackets()
    {
        var policy = new InputSafetyPolicy();
        policy.SetContext("session", "0123456789abcdef", 30_000, true);
        Assert.False(policy.Accept("session", "0123456789abcdef", 1, 4_999, "pointer.move", 10_000));
        Assert.False(policy.Accept("session", "0123456789abcdef", 2, 15_001, "pointer.move", 10_000));
        for (var sequence = 3; sequence < 183; sequence++)
            Assert.True(policy.Accept("session", "0123456789abcdef", sequence, 10_000, "pointer.move", 10_000));
        Assert.False(policy.Accept("session", "0123456789abcdef", 183, 10_000, "pointer.move", 10_000));
    }
}
