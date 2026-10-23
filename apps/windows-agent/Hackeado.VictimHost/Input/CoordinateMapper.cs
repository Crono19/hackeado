namespace Hackeado.VictimHost.Input;

public readonly record struct ScreenBounds(int Left, int Top, int Width, int Height);
public readonly record struct ScreenPoint(int X, int Y, int AbsoluteX, int AbsoluteY);

public sealed class CoordinateMapper
{
    public ScreenPoint Map(double x, double y, ScreenBounds bounds, double dpiScale = 1)
    {
        if (x is < 0 or > 1 || y is < 0 or > 1) throw new ArgumentOutOfRangeException(nameof(x));
        if (bounds.Width <= 1 || bounds.Height <= 1) throw new ArgumentOutOfRangeException(nameof(bounds));
        if (dpiScale is < 0.5 or > 4) throw new ArgumentOutOfRangeException(nameof(dpiScale));
        var pixelX = bounds.Left + (int)Math.Round(x * (bounds.Width - 1));
        var pixelY = bounds.Top + (int)Math.Round(y * (bounds.Height - 1));
        return new ScreenPoint(pixelX, pixelY, (int)Math.Round(x * 65535), (int)Math.Round(y * 65535));
    }
}
