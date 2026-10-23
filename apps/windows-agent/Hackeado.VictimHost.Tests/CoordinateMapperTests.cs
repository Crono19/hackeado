using Hackeado.VictimHost.Input;

namespace Hackeado.VictimHost.Tests;

public sealed class CoordinateMapperTests
{
    private readonly CoordinateMapper _mapper = new();

    [Theory]
    [InlineData(1.0)]
    [InlineData(1.25)]
    [InlineData(1.5)]
    public void MapsCenterAcrossDpiScales(double dpi)
    {
        var point = _mapper.Map(0.5, 0.5, new ScreenBounds(0, 0, 1920, 1080), dpi);
        Assert.InRange(point.X, 959, 960);
        Assert.InRange(point.Y, 539, 540);
        Assert.InRange(point.AbsoluteX, 32767, 32768);
    }

    [Fact]
    public void MapsVirtualDesktopEdges()
    {
        var topLeft = _mapper.Map(0, 0, new ScreenBounds(-1920, 0, 3840, 1080));
        var bottomRight = _mapper.Map(1, 1, new ScreenBounds(-1920, 0, 3840, 1080));
        Assert.Equal((-1920, 0, 0, 0), (topLeft.X, topLeft.Y, topLeft.AbsoluteX, topLeft.AbsoluteY));
        Assert.Equal((1919, 1079, 65535, 65535), (bottomRight.X, bottomRight.Y, bottomRight.AbsoluteX, bottomRight.AbsoluteY));
    }
}
