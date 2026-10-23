using Hackeado.VictimHost.Bridge;
using Hackeado.VictimHost.Configuration;
using Hackeado.VictimHost.Input;
using Hackeado.VictimHost.Safety;
using Hackeado.VictimHost.Telemetry;
using Microsoft.Web.WebView2.Core;

namespace Hackeado.VictimHost;

public partial class MainWindow : System.Windows.Window
{
    private NativeMessageRouter? _router;
    private StopOverlay? _stopOverlay;
    private EmergencyHotkey? _emergencyHotkey;
    private SystemSafetyMonitor? _systemSafetyMonitor;
    private readonly AgentLogger _logger = new();

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
        Closed += OnClosed;
    }

    private async void OnLoaded(object sender, System.Windows.RoutedEventArgs e)
    {
        try
        {
            var configuration = ConfigurationLoader.Load();
            var navigation = new NavigationPolicy(configuration.ServerUri);
            var pointer = new PointerController(new CoordinateMapper());
            var keyboard = new KeyboardController();
            await VictimWebView.EnsureCoreWebView2Async();
            var core = VictimWebView.CoreWebView2;
            core.Settings.AreDevToolsEnabled = configuration.AllowDevTools;
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.AreBrowserAcceleratorKeysEnabled = false;
            core.NewWindowRequested += (_, args) => args.Handled = true;
            core.DownloadStarting += (_, args) => args.Cancel = true;
            core.NavigationStarting += (_, args) =>
            {
                if (!navigation.IsAllowed(args.Uri))
                {
                    args.Cancel = true;
                    _logger.Write("navigation_blocked");
                }
            };
            _stopOverlay = new StopOverlay(() => _router?.Stop("victim"));
            _router = new NativeMessageRouter(
                configuration,
                pointer,
                keyboard,
                SendToWeb,
                _logger,
                (active, operatorName) => Dispatcher.Invoke(() =>
                {
                    if (active) _stopOverlay.ActivateFor(operatorName);
                    else _stopOverlay.Deactivate();
                }));
            _emergencyHotkey = new EmergencyHotkey(this, () => _router?.Stop("emergency"));
            _systemSafetyMonitor = new SystemSafetyMonitor(this, reason =>
            {
                _logger.Write("unsafe_windows_state", reason);
                _router?.Stop("victim");
            });
            core.WebMessageReceived += (_, args) => _router.Handle(args.WebMessageAsJson);
            core.ProcessFailed += (_, _) => _router?.Stop("network");
            core.NavigationCompleted += (_, args) =>
            {
                if (!args.IsSuccess) _router?.Stop("network");
            };
            VictimWebView.Source = configuration.VictimUri;
            AgentStatus.Text = "AGENTE WINDOWS CONECTADO";
            BridgeStatus.Text = "BRIDGE://READY";
            _logger.Write("agent_started");
        }
        catch (Exception exception)
        {
            AgentStatus.Text = "FALLO DE CONFIGURACIÓN";
            BridgeStatus.Text = "BRIDGE://FAULT";
            _logger.Write("startup_fault", exception.GetType().Name);
            System.Windows.MessageBox.Show(
                "No pudo iniciarse HACKEADO Victim Host. Revisa agent-config.json y conexión HTTPS.",
                "HACKEADO",
                System.Windows.MessageBoxButton.OK,
                System.Windows.MessageBoxImage.Error);
            Close();
        }
    }

    private void SendToWeb(object message)
    {
        Dispatcher.Invoke(() => VictimWebView.CoreWebView2?.PostWebMessageAsJson(
            System.Text.Json.JsonSerializer.Serialize(message)));
    }

    private void OnClosed(object? sender, EventArgs e)
    {
        _router?.Stop("victim", false);
        _router?.Dispose();
        _emergencyHotkey?.Dispose();
        _systemSafetyMonitor?.Dispose();
        _stopOverlay?.Close();
        VictimWebView.Dispose();
        _logger.Write("agent_closed");
    }
}
