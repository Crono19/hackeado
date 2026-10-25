using Hackeado.VictimHost.Input;
using System.Reflection;
using System.Runtime.InteropServices;

namespace Hackeado.VictimHost.Tests;

public sealed class KeyboardControllerTests
{
    [Theory]
    [InlineData("KeyA")]
    [InlineData("Digit0")]
    [InlineData("Semicolon")]
    [InlineData("Numpad7")]
    [InlineData("F11")]
    public void AllowsExpectedCodes(string code) => Assert.True(KeyboardController.IsAllowedCode(code));

    [Theory]
    [InlineData("F12")]
    [InlineData("MetaLeft")]
    [InlineData("LaunchMail")]
    public void BlocksCodesOutsideAllowlist(string code) => Assert.False(KeyboardController.IsAllowedCode(code));

    [Fact]
    public void UsesTheNativeWin32InputStructureSize()
    {
        var input = typeof(KeyboardController).GetNestedType("INPUT", BindingFlags.NonPublic);

        Assert.NotNull(input);
        Assert.Equal(IntPtr.Size == 8 ? 40 : 28, Marshal.SizeOf(input!));
    }
}
