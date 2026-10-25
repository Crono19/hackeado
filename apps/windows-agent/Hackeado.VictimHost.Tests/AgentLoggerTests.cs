using System.IO;
using Hackeado.VictimHost.Telemetry;

namespace Hackeado.VictimHost.Tests;

public sealed class AgentLoggerTests
{
    [Fact]
    public void RotatesAndSanitizesMinimalLogs()
    {
        var directory = Path.Combine(Path.GetTempPath(), $"hackeado-log-{Guid.NewGuid():N}");
        try
        {
            var logger = new AgentLogger(directory, 1024);
            for (var index = 0; index < 80; index++)
                logger.Write("control.event", "secret value with spaces and symbols!" + new string('x', 80));
            Assert.True(File.Exists(Path.Combine(directory, "victim-host.log.1")));
            var current = File.ReadAllText(Path.Combine(directory, "victim-host.log"));
            Assert.DoesNotContain("secret value", current);
            Assert.DoesNotContain("!", current);
        }
        finally
        {
            if (Directory.Exists(directory)) Directory.Delete(directory, true);
        }
    }
}
