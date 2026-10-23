namespace Hackeado.VictimHost.Configuration;

public sealed record AgentConfiguration(
    string ServerUrl,
    string DeviceId,
    string AgentKey,
    string DisplayName,
    string EmergencyHotkey,
    bool AllowDevTools)
{
    public Uri ServerUri => new(ServerUrl.TrimEnd('/') + "/");
    public Uri VictimUri => new(ServerUri, "victima");
}
