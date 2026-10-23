namespace Hackeado.VictimHost.Input;

public sealed class InputSafetyPolicy
{
    private string? _sessionId;
    private string? _leaseId;
    private long _expiresAt;
    private long _lastSequence = -1;
    private readonly Queue<long> _moves = new();
    private readonly Queue<long> _actions = new();

    public void SetContext(string sessionId, string leaseId, long expiresAt, bool consentGranted)
    {
        if (!consentGranted || string.IsNullOrWhiteSpace(sessionId) || leaseId.Length < 16)
            throw new InvalidOperationException("control_context_invalid");
        var sameLease = _sessionId == sessionId && _leaseId == leaseId;
        _sessionId = sessionId;
        _leaseId = leaseId;
        _expiresAt = expiresAt;
        if (!sameLease)
        {
            _lastSequence = -1;
            _moves.Clear();
            _actions.Clear();
        }
    }

    public bool Accept(string sessionId, string leaseId, long sequence, long sentAt, string type, long now)
    {
        if (_sessionId != sessionId || _leaseId != leaseId || now >= _expiresAt) return false;
        if (sequence <= _lastSequence || Math.Abs(now - sentAt) > 5_000) return false;
        var bucket = type == "pointer.move" ? _moves : _actions;
        var limit = type == "pointer.move" ? 180 : 80;
        while (bucket.Count > 0 && bucket.Peek() <= now - 1_000) bucket.Dequeue();
        if (bucket.Count >= limit) return false;
        bucket.Enqueue(now);
        _lastSequence = sequence;
        return true;
    }

    public void Clear()
    {
        _sessionId = null;
        _leaseId = null;
        _expiresAt = 0;
        _lastSequence = -1;
        _moves.Clear();
        _actions.Clear();
    }
}
