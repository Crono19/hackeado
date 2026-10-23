using System.Text.Json;

namespace Hackeado.VictimHost.Configuration;

public static class ConfigurationLoader
{
    public static AgentConfiguration Load(string? path = null)
    {
        path ??= Path.Combine(AppContext.BaseDirectory, "agent-config.json");
        if (!File.Exists(path)) throw new InvalidOperationException("agent_config_missing");
        var json = File.ReadAllText(path);
        var config = JsonSerializer.Deserialize<AgentConfiguration>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? throw new InvalidOperationException("agent_config_invalid");
        Validate(config);
        return config;
    }

    public static void Validate(AgentConfiguration config)
    {
        if (!Uri.TryCreate(config.ServerUrl, UriKind.Absolute, out var server))
            throw new InvalidOperationException("server_url_invalid");
        var localHttp = server.Scheme == Uri.UriSchemeHttp &&
                        (server.Host == "localhost" || server.Host == "127.0.0.1");
        if (server.Scheme != Uri.UriSchemeHttps && !localHttp)
            throw new InvalidOperationException("https_required");
        if (string.IsNullOrWhiteSpace(config.DeviceId) || config.DeviceId.Length > 80)
            throw new InvalidOperationException("device_id_invalid");
        if (config.AgentKey.Length < 16 || config.AgentKey.Contains("replace-with", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("agent_key_invalid");
        if (string.IsNullOrWhiteSpace(config.DisplayName))
            throw new InvalidOperationException("display_name_required");
    }
}
