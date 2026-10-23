namespace Hackeado.VictimHost.Safety;

public sealed class NavigationPolicy
{
    private readonly Uri _origin;

    public NavigationPolicy(Uri origin) => _origin = origin;

    public bool IsAllowed(string candidate)
    {
        if (!Uri.TryCreate(candidate, UriKind.Absolute, out var uri)) return false;
        if (uri.Scheme is not ("https" or "http")) return false;
        return string.Equals(uri.Scheme, _origin.Scheme, StringComparison.OrdinalIgnoreCase) &&
               string.Equals(uri.Host, _origin.Host, StringComparison.OrdinalIgnoreCase) &&
               uri.Port == _origin.Port;
    }
}
