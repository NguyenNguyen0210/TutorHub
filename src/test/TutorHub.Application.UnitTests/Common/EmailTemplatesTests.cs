using System.Net;
using TutorHub.Application.Common.Email;
using TutorHub.Application.Common.Events;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Common;

public class EmailTemplatesTests
{
    private static readonly DateTime UtcTime = new(2026, 11, 5, 2, 30, 0, DateTimeKind.Utc);

    public static IEnumerable<object[]> EventTypes() => typeof(IBusinessEvent).Assembly.GetTypes()
        .Where(type => type.IsClass && !type.IsAbstract && typeof(IBusinessEvent).IsAssignableFrom(type))
        .SelectMany(type => new[] { new object[] { type, UserRole.Student }, new object[] { type, UserRole.Tutor } });

    [Theory]
    [MemberData(nameof(EventTypes))]
    public void EveryCurrentEvent_HasVietnameseHtmlEmailWithoutInternalTypeNames(Type eventType, UserRole role)
    {
        var message = BusinessEmailTemplates.Create(Sample(eventType), "Minh Anh", role, "/app/notifications");
        var text = WebUtility.HtmlDecode(message.Html);
        Assert.Contains("<html lang=\"vi\">", message.Html);
        Assert.Contains("Xin chào Minh Anh,", text);
        Assert.Contains("giờ Việt Nam", text);
        Assert.Contains("https://tutorhub.id.vn/", message.Html);
        Assert.DoesNotContain("Bạn có thông báo mới từ TutorHub", message.Subject);
        Assert.DoesNotContain(eventType.Name, message.Html);
        Assert.DoesNotContain("UTC", text);
        Assert.DoesNotContain("https://tutorhub.vn", message.Html);
        Assert.InRange(message.Subject.Length, 1, 160);
    }

    [Fact]
    public void OtpTemplate_KeepsTheCodeOutOfSubjectLinksAndPreview()
    {
        var message = EmailTemplates.PasswordResetCode("Minh Anh", "135790");
        var text = WebUtility.HtmlDecode(message.Html);
        Assert.Contains("135790", text);
        Assert.Contains("5 phút", text);
        Assert.Contains("Chỉ sử dụng một lần", text);
        Assert.Contains("Không chia sẻ mã", text);
        Assert.DoesNotContain("135790", message.Subject);
        foreach (System.Text.RegularExpressions.Match link in System.Text.RegularExpressions.Regex.Matches(message.Html, "href=\"([^\"]*)\""))
            Assert.DoesNotContain("135790", link.Groups[1].Value);
        var preview = message.Html.Split("opacity:0;\">", 2)[1].Split("</div>", 2)[0];
        Assert.DoesNotContain("135790", preview);
    }

    [Theory]
    [InlineData(UserRole.Student, "Học viên")]
    [InlineData(UserRole.Tutor, "Gia sư")]
    public void Welcome_UsesHumanRoleAndExplicitLogin(UserRole role, string label)
    {
        var message = EmailTemplates.Welcome("Minh Anh", "owner@example.com", role, UtcTime);
        var text = WebUtility.HtmlDecode(message.Html);
        Assert.Contains(label, text);
        Assert.Contains("09:30, 05/11/2026", text);
        Assert.Contains("https://tutorhub.id.vn/auth/login", message.Html);
        Assert.Contains("owner@example.com", text);
        if (role == UserRole.Tutor) Assert.Contains("xét duyệt", text);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void SecurityEmail_PreservesTimeAndRecoveryGuidance(bool reset)
    {
        var message = EmailTemplates.PasswordUpdated("Minh Anh", "owner@example.com", UtcTime, reset);
        var text = WebUtility.HtmlDecode(message.Html);
        Assert.Contains("09:30, 05/11/2026", text);
        Assert.Contains("phiên đăng nhập cũ", text);
        Assert.Contains("Nếu không phải bạn", text);
        Assert.Contains("/auth/forgot-password", message.Html);
        Assert.DoesNotContain("support@tutorhub.vn", message.Html);
    }

    [Fact]
    public void DynamicText_IsEncodedAndCannotCreateMarkup()
    {
        var message = BusinessEmailTemplates.Create(new TutorApplicationRejectedEvent(Guid.NewGuid(), Guid.NewGuid(), "Lý do <script>alert('x')</script> & phản hồi"), "<img src=x onerror=alert(1)>", UserRole.Tutor, "/tutor/application");
        Assert.DoesNotContain("<script>", message.Html);
        Assert.DoesNotContain("<img src=x", message.Html);
        Assert.Contains("&lt;script&gt;", message.Html);
        Assert.Contains("Lý do <script>", WebUtility.HtmlDecode(message.Html));
    }

    [Theory]
    [InlineData("https://evil.example/phishing")]
    [InlineData("//evil.example/phishing")]
    [InlineData("/\\evil.example")]
    [InlineData("/path\r\ninjected")]
    public void UnsafeActionLinks_AreNotRendered(string path)
    {
        var message = EmailTemplates.Message("Tiêu đề", "Minh Anh", "Tiêu đề", "Nội dung", Array.Empty<(string, string)>(), path);
        Assert.DoesNotContain("Nếu nút không mở được", WebUtility.HtmlDecode(message.Html));
        Assert.DoesNotContain("href=\"https://evil", message.Html);
    }

    [Fact]
    public void FinancialEmail_KeepsAmountsAndResolvedLink()
    {
        var id = Guid.NewGuid();
        var message = BusinessEmailTemplates.Create(new EarningCreatedEvent(id, id, id, new(3_200_000), new(320_000), new(2_880_000), id), "Minh Anh", UserRole.Tutor, $"/tutor/wallet?tab=history&recordId={id}");
        var text = WebUtility.HtmlDecode(message.Html);
        Assert.Contains("3.200.000 ₫", text);
        Assert.Contains("320.000 ₫", text);
        Assert.Contains("2.880.000 ₫", text);
        Assert.Contains($"/tutor/wallet?tab=history&recordId={id}", text);
        Assert.Contains("&amp;recordId=", message.Html);
    }

    [Fact]
    public void RescheduleEmail_ShowsBothPreviousAndNewTimes()
    {
        var id = Guid.NewGuid();
        var message = BusinessEmailTemplates.Create(new SessionRescheduledEvent(id, id, id, id, UtcTime, UtcTime.AddHours(1), UtcTime.AddDays(1), UtcTime.AddDays(1).AddHours(1)), "Minh Anh", UserRole.Student, "/sessions/" + id);
        var text = WebUtility.HtmlDecode(message.Html);
        Assert.Contains("09:30, 05/11/2026", text);
        Assert.Contains("10:30, 05/11/2026", text);
        Assert.Contains("09:30, 06/11/2026", text);
        Assert.Contains("10:30, 06/11/2026", text);
    }

    [Fact]
    public void ResolutionEmail_UsesReadableDecision()
    {
        var id = Guid.NewGuid();
        var message = BusinessEmailTemplates.Create(new DisputeResolvedEvent(id, id, id, id, "StudentWinsPartialRefund"), "Minh Anh", UserRole.Student, "/app/disputes/" + id);
        Assert.DoesNotContain("StudentWinsPartialRefund", message.Html);
        Assert.Contains("Hoàn một phần học phí", WebUtility.HtmlDecode(message.Html));
    }

    private static IBusinessEvent Sample(Type type)
    {
        var constructor = type.GetConstructors().OrderByDescending(value => value.GetParameters().Length).First();
        var values = constructor.GetParameters().Select(parameter => parameter.HasDefaultValue ? parameter.DefaultValue
            : parameter.ParameterType == typeof(Guid) ? (object)Guid.NewGuid()
            : parameter.ParameterType == typeof(DateTime) ? UtcTime
            : parameter.ParameterType == typeof(int) ? 5
            : parameter.ParameterType == typeof(MoneyDto) ? new MoneyDto(250_000)
            : parameter.ParameterType == typeof(string) ? "Thông tin phản hồi"
            : null).ToArray();
        return (IBusinessEvent)constructor.Invoke(values);
    }
}
