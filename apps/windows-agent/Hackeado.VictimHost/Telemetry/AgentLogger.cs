using System.IO;

namespace Hackeado.VictimHost.Telemetry;

public sealed class AgentLogger
{
    private const int BackupCount = 3;
    private readonly string _path;
    private readonly long _maxBytes;
    private readonly object _gate = new();

    public AgentLogger(string? logDirectory = null, long maxBytes = 512 * 1024)
    {
        var directory = logDirectory ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HACKEADO", "Logs");
        Directory.CreateDirectory(directory);
        _path = Path.Combine(directory, "victim-host.log");
        _maxBytes = Math.Max(1024, maxBytes);
    }

    public void Write(string eventName, string? detail = null)
    {
        var safeEvent = Sanitize(eventName);
        var safeDetail = Sanitize(detail ?? "-");
        lock (_gate)
        {
            RotateIfNeeded();
            File.AppendAllText(_path, $"{DateTimeOffset.UtcNow:O} {safeEvent} {safeDetail}{Environment.NewLine}");
        }
    }

    private void RotateIfNeeded()
    {
        if (!File.Exists(_path) || new FileInfo(_path).Length < _maxBytes) return;
        var oldest = $"{_path}.{BackupCount}";
        if (File.Exists(oldest)) File.Delete(oldest);
        for (var index = BackupCount - 1; index >= 1; index--)
        {
            var source = $"{_path}.{index}";
            if (File.Exists(source)) File.Move(source, $"{_path}.{index + 1}", true);
        }
        File.Move(_path, $"{_path}.1", true);
    }

    private static string Sanitize(string value) =>
        new(value.Where(character => char.IsLetterOrDigit(character) || "._-".Contains(character)).Take(80).ToArray());
}
