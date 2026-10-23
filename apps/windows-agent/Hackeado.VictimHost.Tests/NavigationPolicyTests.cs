using Hackeado.VictimHost.Safety;

namespace Hackeado.VictimHost.Tests;

public sealed class NavigationPolicyTests
{
    private readonly NavigationPolicy _policy = new(new Uri("https://10.0.0.2:3000/"));

    [Fact]
    public void AllowsOnlyConfiguredOrigin()
    {
        Assert.True(_policy.IsAllowed("https://10.0.0.2:3000/victima"));
        Assert.False(_policy.IsAllowed("https://10.0.0.2:4000/victima"));
        Assert.False(_policy.IsAllowed("https://example.com/victima"));
        Assert.False(_policy.IsAllowed("javascript:alert(1)"));
    }
}
