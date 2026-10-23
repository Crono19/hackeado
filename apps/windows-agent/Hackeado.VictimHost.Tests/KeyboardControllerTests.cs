using Hackeado.VictimHost.Input;

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
}
