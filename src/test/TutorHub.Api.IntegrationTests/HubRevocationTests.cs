using System.Net.WebSockets;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TutorHub.Application.Common.Security;

namespace TutorHub.Api.IntegrationTests;

public class HubRevocationTests : IntegrationTestBase
{
    public HubRevocationTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Theory]
    [InlineData("chat")]
    [InlineData("notifications")]
    public async Task ReceivingConnectionIsClosedAfterAccountRevocation(string hub)
    {
        var (user, tutor, _) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var token = Scope.ServiceProvider.GetRequiredService<IJwtService>().GenerateAccessToken(user, tutor.Id);
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        var client = Factory.Server.CreateWebSocketClient();
        using var socket = await client.ConnectAsync(new Uri($"ws://localhost/hubs/{hub}?access_token={Uri.EscapeDataString(token)}"), timeout.Token);
        await socket.SendAsync(Encoding.UTF8.GetBytes("{\"protocol\":\"json\",\"version\":1}\u001e"), WebSocketMessageType.Text, true, timeout.Token);
        var buffer = new byte[4096];
        var handshake = await socket.ReceiveAsync(buffer, timeout.Token);
        Assert.Contains("{}", Encoding.UTF8.GetString(buffer, 0, handshake.Count));
        user.Ban(); await Db.SaveChangesAsync();
        bool closed = false;
        while (!closed)
        {
            var message = await socket.ReceiveAsync(buffer, timeout.Token);
            closed = message.MessageType == WebSocketMessageType.Close
                || Encoding.UTF8.GetString(buffer, 0, message.Count).Contains("\"type\":7", StringComparison.Ordinal);
        }
        Assert.True(closed);
        Assert.False(await Db.Users.AsNoTracking().AnyAsync(u => u.Id == user.Id && u.TokenVersion == 0));
    }
}
