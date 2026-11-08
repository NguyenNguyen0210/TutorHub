using System.Globalization;
using System.Net;
using System.Text;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Common.Email;

public record EmailContent(string Subject, string Html);

/// <summary>Presentation only: HTML-encode content, keep OTPs out of subjects and URLs.</summary>
public static class EmailTemplates
{
    public const string SiteUrl = "https://tutorhub.id.vn";

    public static EmailContent Welcome(string name, string email, UserRole role, DateTime createdAt)
    {
        var tutor = role == UserRole.Tutor;
        return Message("Đăng ký tài khoản thành công", name,
            "Chào mừng bạn đến với TutorHub",
            tutor
                ? "Tài khoản gia sư của bạn đã được tạo. Hãy đăng nhập để hoàn thiện hồ sơ giảng dạy và theo dõi quá trình xét duyệt."
                : "Tài khoản của bạn đã được tạo. Hãy đăng nhập để tìm gia sư, so sánh gói học và lựa chọn lộ trình phù hợp với mục tiêu của bạn.",
            new[] { ("Email đăng ký", email), ("Loại tài khoản", tutor ? "Gia sư" : "Học viên"), ("Ngày tạo", VietnamTime(createdAt)) },
            "/auth/login", "Đăng nhập vào TutorHub");
    }

    public static EmailContent PasswordResetCode(string name, string code)
    {
        var content = Paragraph("Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản TutorHub của bạn. Nhập mã dưới đây tại màn hình xác nhận để tiếp tục.")
            + $"<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;\"><tr><td align=\"center\" style=\"padding:24px 12px;\"><p style=\"margin:0 0 12px;font-size:13px;color:#475569;\">Mã xác nhận của bạn</p><p style=\"margin:0;font-size:32px;font-weight:700;letter-spacing:8px;color:#1d4ed8;\">{Encode(code)}</p><p style=\"margin:12px 0 0;font-size:13px;color:#475569;\">Có hiệu lực trong 5 phút · Chỉ sử dụng một lần</p></td></tr></table>"
            + Notice("Không chia sẻ mã này với bất kỳ ai. TutorHub không yêu cầu bạn cung cấp mã xác nhận hoặc mật khẩu qua email hay tin nhắn.")
            + Paragraph("Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi nếu chưa hoàn tất xác nhận.");
        return new("Mã xác nhận đặt lại mật khẩu — TutorHub", Frame(name, "Đặt lại mật khẩu", "Mã xác nhận có hiệu lực trong 5 phút. Không chia sẻ mã với người khác.", content));
    }

    public static EmailContent PasswordUpdated(string name, string email, DateTime changedAt, bool isReset)
    {
        var title = isReset ? "Mật khẩu của bạn đã được đặt lại" : "Mật khẩu của bạn đã được thay đổi";
        var content = Paragraph("TutorHub ghi nhận mật khẩu tài khoản của bạn vừa được cập nhật thành công. Các phiên đăng nhập cũ đã bị thu hồi để bảo vệ tài khoản.")
            + Details(new[] { ("Tài khoản", email), ("Thời gian", VietnamTime(changedAt)), ("Thao tác", isReset ? "Đặt lại mật khẩu" : "Đổi mật khẩu") })
            + Notice("Nếu bạn thực hiện thao tác này, bạn không cần làm gì thêm. Nếu không phải bạn, hãy đặt lại mật khẩu ngay và liên hệ đội ngũ hỗ trợ qua TutorHub.")
            + Action("/auth/forgot-password", "Bảo vệ tài khoản");
        return new(title + " — TutorHub", Frame(name, title, "Kiểm tra hoạt động bảo mật gần đây trên tài khoản TutorHub của bạn.", content));
    }

    public static EmailContent Message(string subject, string name, string title, string summary,
        IEnumerable<(string Label, string Value)> details, string? path, string actionLabel = "Xem chi tiết", string? notice = null)
    {
        var content = Paragraph(summary) + Details(details);
        if (!string.IsNullOrWhiteSpace(notice)) content += Notice(notice);
        content += Action(path, actionLabel);
        return new(subject + " — TutorHub", Frame(name, title, summary, content));
    }

    public static string VietnamTime(DateTime value)
    {
        var utc = value.Kind == DateTimeKind.Local ? value.ToUniversalTime() : DateTime.SpecifyKind(value, DateTimeKind.Utc);
        return utc.AddHours(7).ToString("HH:mm, dd/MM/yyyy", CultureInfo.GetCultureInfo("vi-VN")) + " (giờ Việt Nam)";
    }

    private static string Encode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);
    private static string Paragraph(string value) => $"<p style=\"margin:0 0 16px;font-size:15px;line-height:1.75;color:#334155;\">{Encode(value)}</p>";
    private static string Notice(string value) => $"<div style=\"margin:24px 0;padding:16px 18px;background:#f8fafc;border-left:3px solid #2563eb;\"><p style=\"margin:0;font-size:14px;line-height:1.7;color:#334155;\">{Encode(value)}</p></div>";

    private static string Details(IEnumerable<(string Label, string Value)> rows)
    {
        var content = new StringBuilder();
        foreach (var (label, value) in rows)
            content.Append($"<tr><td valign=\"top\" style=\"padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:13px;line-height:1.6;color:#64748b;width:38%;\">{Encode(label)}</td><td valign=\"top\" style=\"padding:12px 0 12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;line-height:1.6;font-weight:600;color:#0f172a;overflow-wrap:anywhere;word-break:break-word;\">{Encode(value)}</td></tr>");
        return content.Length == 0 ? string.Empty : $"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:20px 0 24px;border-collapse:collapse;table-layout:fixed;\">{content}</table>";
    }

    private static string Action(string? path, string label)
    {
        // Paths come from server-side route generation, never arbitrary HTML/hrefs.
        if (string.IsNullOrWhiteSpace(path) || !path.StartsWith('/') || path.StartsWith("//") || path.Contains('\\') || path.Any(char.IsControl))
            return string.Empty;
        var url = Encode(SiteUrl + path);
        return $"<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0 16px;\"><tr><td bgcolor=\"#2563eb\" style=\"border-radius:8px;\"><a href=\"{url}\" style=\"display:inline-block;padding:14px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;\">{Encode(label)}</a></td></tr></table><p style=\"margin:0;font-size:12px;line-height:1.6;color:#64748b;\">Nếu nút không mở được, hãy dùng liên kết:<br><a href=\"{url}\" style=\"color:#1d4ed8;word-break:break-all;\">{url}</a></p>";
    }

    private static string Frame(string name, string title, string preview, string content) => $$"""
        <!doctype html>
        <html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{Encode(title)}}</title></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;-webkit-text-size-adjust:100%;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{{Encode(preview)}}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;"><tr><td align="center" style="padding:28px 12px;">
            <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
              <tr><td style="padding:28px 24px 20px;border-bottom:1px solid #e2e8f0;"><a href="{{SiteUrl}}" style="font-size:24px;font-weight:700;color:#0f172a;text-decoration:none;">Tutor<span style="color:#2563eb;">Hub</span></a></td></tr>
              <tr><td style="padding:28px 24px;">
                <h1 style="margin:0 0 24px;font-size:24px;line-height:1.4;letter-spacing:-0.4px;color:#0f172a;">{{Encode(title)}}</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">{{Encode(string.IsNullOrWhiteSpace(name) ? "Xin chào bạn," : $"Xin chào {name},")}}</p>
                {{content}}
                <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#334155;">Trân trọng,<br><strong>Đội ngũ TutorHub</strong></p>
              </td></tr>
              <tr><td style="padding:20px 24px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.7;color:#64748b;">Email được gửi tự động từ TutorHub, vui lòng không trả lời trực tiếp.<br>Cần thêm thông tin? <a href="{{SiteUrl}}/how-it-works" style="color:#1d4ed8;">Xem hướng dẫn trên TutorHub</a>.</td></tr>
            </table>
            <!--[if mso]></td></tr></table><![endif]-->
            <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#64748b;">TutorHub · Kết nối gia sư, tiếp nối hành trình học</p>
          </td></tr></table>
        </body></html>
        """;
}
