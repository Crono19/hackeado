using Hackeado.VictimHost.Configuration;

namespace Hackeado.VictimHost.Tests;

public sealed class ConfigurationLoaderTests
{
    [Fact]
    public void AcceptsHttpsConfiguration()
    {
        var config = new AgentConfiguration(
            "https://192.168.1.10:3000",
            "hackeado-windows-vm",
            "0123456789abcdef0123456789abcdef",
            "VM demo",
            "Ctrl+Shift+F12",
            false);
        ConfigurationLoader.Validate(config);
        Assert.Equal("https", config.ServerUri.Scheme);
    }

    [Theory]
    [InlineData("http://192.168.1.10:3000")]
    [InlineData("file:///C:/demo.html")]
    public void RejectsUnsafeOrigins(string origin)
    {
        var config = new AgentConfiguration(origin, "demo-device", "0123456789abcdef", "VM", "Ctrl+Shift+F12", false);
        Assert.Throws<InvalidOperationException>(() => ConfigurationLoader.Validate(config));
    }
}
