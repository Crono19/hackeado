using System.Windows.Threading;

namespace Hackeado.VictimHost;

public partial class StopOverlay : System.Windows.Window
{
    private readonly Action _onStop;
    private readonly DispatcherTimer _timer = new() { Interval = TimeSpan.FromSeconds(1) };
    private DateTimeOffset _startedAt;

    public StopOverlay(Action onStop)
    {
        InitializeComponent();
        _onStop = onStop;
        _timer.Tick += (_, _) => UpdateElapsed();
    }

    public void ActivateFor(string operatorName)
    {
        OperatorText.Text = $"OPERADOR // {operatorName.ToUpperInvariant()}";
        _startedAt = DateTimeOffset.UtcNow;
        UpdateElapsed();
        PositionAtTop();
        if (!IsVisible) Show();
        Topmost = true;
        _timer.Start();
    }

    public void Deactivate()
    {
        _timer.Stop();
        Hide();
    }

    private void PositionAtTop()
    {
        Left = Math.Max(0, (System.Windows.SystemParameters.WorkArea.Width - Width) / 2);
        Top = System.Windows.SystemParameters.WorkArea.Top + 12;
    }

    private void UpdateElapsed()
    {
        var elapsed = DateTimeOffset.UtcNow - _startedAt;
        ElapsedText.Text = $"TIEMPO {elapsed:mm\\:ss}";
    }

    private void StopButton_Click(object sender, System.Windows.RoutedEventArgs e) => _onStop();
}
