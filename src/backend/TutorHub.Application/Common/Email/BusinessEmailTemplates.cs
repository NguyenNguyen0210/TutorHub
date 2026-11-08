using System.Globalization;
using TutorHub.Application.Common.Events;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Common.Email;

public static class BusinessEmailTemplates
{
    private record Content(string Title, string Summary, (string Label, string Value)[] Details, string Action = "Xem chi tiết", string? Notice = null);
    private static (string Label, string Value)[] Rows(params (string Label, string Value)[] rows) => rows;
    private static string Money(MoneyDto money) => money.Amount.ToString(money.Currency == "VND" ? "N0" : "N2", CultureInfo.GetCultureInfo("vi-VN")) + (money.Currency == "VND" ? " ₫" : " " + money.Currency);

    public static EmailContent Create(IBusinessEvent notification, string name, UserRole role, string? path)
    {
        var content = notification switch
        {
            TutorApplicationSubmittedEvent e => new Content("Có hồ sơ gia sư cần xét duyệt", "Một hồ sơ gia sư vừa được gửi đến TutorHub. Vui lòng xem thông tin và xử lý theo quy trình xét duyệt.", Rows(("Mã hồ sơ", e.ApplicationId.ToString())), "Xem hồ sơ xét duyệt"),
            TutorApplicationApprovedEvent => new Content("Hồ sơ giảng dạy đã được duyệt", "Hồ sơ của bạn đã được TutorHub phê duyệt. Bạn có thể mở không gian giảng dạy để hoàn thiện thông tin và quản lý các gói học.", Rows(), "Mở hồ sơ giảng dạy"),
            TutorApplicationRejectedEvent e => new Content("Cập nhật về hồ sơ giảng dạy", "Hồ sơ của bạn chưa được phê duyệt. Vui lòng xem phản hồi, cập nhật thông tin phù hợp và gửi lại hồ sơ khi sẵn sàng.", Rows(("Phản hồi xét duyệt", e.Reason)), "Xem và cập nhật hồ sơ"),
            PaymentSucceededEvent e => new Content("Thanh toán gói học thành công", "TutorHub đã xác nhận thanh toán của bạn. Bạn có thể mở hợp đồng để xem lộ trình và trao đổi lịch học với gia sư.", Rows(("Số tiền thanh toán", Money(e.Amount)), ("Mã đơn đặt chỗ", e.BookingId.ToString())), "Xem hợp đồng", "Học phí được TutorHub giữ và giải ngân theo từng buổi học theo điều kiện của hợp đồng."),
            EnrollmentActivatedEvent e => new Content(role == UserRole.Tutor ? "Bạn có hợp đồng học tập mới" : "Gói học của bạn đã sẵn sàng", role == UserRole.Tutor ? "Một học viên đã hoàn tất đăng ký gói học. Hãy mở hợp đồng để trao đổi và thống nhất lịch học." : "Hợp đồng học tập của bạn đã có hiệu lực. Hãy trao đổi với gia sư để thống nhất lịch cho các buổi học.", Rows(("Mã hợp đồng", e.EnrollmentId.ToString())), "Xem lộ trình học"),
            EnrollmentCancelledEvent e => new Content("Hợp đồng học tập đã được hủy", "TutorHub đã ghi nhận việc hủy hợp đồng. Vui lòng mở chi tiết để xem các buổi học và thông tin học phí liên quan.", Rows(("Mã hợp đồng", e.EnrollmentId.ToString()), ("Lý do hủy", e.Reason)), "Xem hợp đồng"),
            SessionScheduledEvent e => new Content("Lịch học đã được xác nhận", "Buổi học đã được xếp lịch. Bạn hãy kiểm tra thời gian và thông tin buổi học để chuẩn bị tham gia.", Rows(("Bắt đầu", EmailTemplates.VietnamTime(e.StartAt)), ("Kết thúc", EmailTemplates.VietnamTime(e.EndAt))), "Xem buổi học"),
            SessionRescheduledEvent e => new Content("Lịch học của bạn đã thay đổi", "Buổi học đã được chuyển sang khung giờ mới. Vui lòng kiểm tra lịch đã cập nhật trước khi tham gia.", Rows(("Bắt đầu trước đây", EmailTemplates.VietnamTime(e.PreviousStartAt)), ("Kết thúc trước đây", EmailTemplates.VietnamTime(e.PreviousEndAt)), ("Bắt đầu mới", EmailTemplates.VietnamTime(e.NewStartAt)), ("Kết thúc mới", EmailTemplates.VietnamTime(e.NewEndAt))), "Xem lịch mới"),
            SessionCancelledEvent e => new Content("Buổi học đã được hủy", "Lịch của buổi học này đã được hủy. Bạn có thể xem chi tiết và trao đổi với bên còn lại nếu cần thống nhất kế hoạch tiếp theo.", Rows(("Lý do hủy", e.Reason)), "Xem buổi học"),
            SessionReminderDueEvent e => new Content("Nhắc lịch buổi học sắp tới", "Bạn có một buổi học sắp diễn ra. Hãy mở chi tiết để kiểm tra thời gian và chuẩn bị tài liệu cần thiết.", Rows(("Thời gian bắt đầu", EmailTemplates.VietnamTime(e.StartAt))), "Xem buổi học"),
            GracePeriodStartedEvent e => new Content(role == UserRole.Tutor ? "Buổi học đã kết thúc, học phí đang chờ giải ngân" : "Buổi học đã kết thúc, hãy kiểm tra nội dung học", role == UserRole.Tutor ? "Buổi học đã bắt đầu thời gian phản hồi 12 giờ. Học phí sẽ được giải ngân sau thời hạn này nếu không có sự cố hoặc tranh chấp cần xử lý." : "Bạn có 12 giờ để phản hồi hoặc báo cáo sự cố trước khi học phí của buổi học được tự động giải ngân cho gia sư.", Rows(("Hạn phản hồi", EmailTemplates.VietnamTime(e.GracePeriodEndsAt))), "Xem buổi học"),
            GracePeriodClosingSoonEvent e => new Content("Sắp hết thời gian phản hồi buổi học", "Thời gian phản hồi của buổi học sắp kết thúc. Nếu có vấn đề cần hỗ trợ, bạn hãy gửi báo cáo trước thời hạn dưới đây.", Rows(("Buổi học", $"Buổi {e.SessionNumber}"), ("Hạn phản hồi", EmailTemplates.VietnamTime(e.GracePeriodEndsAt))), "Kiểm tra buổi học"),
            SessionIssueReportedEvent e => new Content(role == UserRole.Tutor ? "Có phản hồi về buổi học của bạn" : "Đã tiếp nhận báo cáo sự cố buổi học", "Học phí của buổi học được tạm giữ trong thời gian xem xét. Vui lòng mở chi tiết để theo dõi và cung cấp thông tin khi cần.", Rows(("Nội dung báo cáo", e.Reason)), "Xem buổi học"),
            SessionCompletedEvent => new Content("Buổi học đã hoàn thành", "Buổi học đã được ghi nhận hoàn thành. Bạn có thể mở lộ trình để theo dõi tiến độ và thông tin học phí.", Rows(), "Xem buổi học"),
            EarningCreatedEvent e => new Content("Thu nhập buổi học đã được cập nhật", "Khoản thu nhập sau phí nền tảng đã được cộng vào số dư khả dụng trong Ví gia sư.", Rows(("Thu nhập nhận được", Money(e.NetPayout)), ("Học phí buổi học", Money(e.Gross)), ("Phí nền tảng", Money(e.Fee)), ("Mã giao dịch", e.TransactionId.ToString())), "Xem thu nhập"),
            RefundCreatedEvent e => new Content("Khoản hoàn học phí đã được ghi nhận", "TutorHub đã ghi nhận khoản hoàn học phí. Bạn có thể theo dõi trạng thái và thông tin đối soát trong chi tiết giao dịch.", Rows(("Số tiền hoàn", Money(e.Amount)), ("Mã giao dịch", e.TransactionId.ToString())), "Theo dõi khoản hoàn"),
            RefundCompletedEvent e => new Content("Hoàn học phí thành công", "Khoản hoàn học phí đã được ghi nhận hoàn tất. Vui lòng mở chi tiết để kiểm tra giao dịch và số dư liên quan.", Rows(("Số tiền đã hoàn", Money(e.Amount)), ("Mã giao dịch", e.TransactionId.ToString())), "Xem khoản hoàn"),
            RefundFailedEvent e => new Content("Khoản hoàn học phí cần được kiểm tra", "Khoản hoàn học phí chưa thể hoàn tất tự động và cần được xử lý tiếp. Vui lòng theo dõi thông tin cập nhật trong chi tiết giao dịch.", Rows(("Số tiền hoàn", Money(e.Amount)), ("Thông tin xử lý", e.Reason), ("Mã giao dịch", e.TransactionId.ToString())), "Theo dõi khoản hoàn"),
            WithdrawalRequestedEvent e => new Content("Đã tiếp nhận yêu cầu rút tiền", "Yêu cầu rút tiền của bạn đang chờ xử lý. Bạn có thể theo dõi trạng thái trong Ví gia sư.", Rows(("Số tiền yêu cầu", Money(e.Amount)), ("Mã yêu cầu", e.WithdrawalId.ToString())), "Theo dõi yêu cầu"),
            WithdrawalCompletedEvent e => new Content("Yêu cầu rút tiền đã hoàn tất", "Yêu cầu rút tiền đã được ghi nhận hoàn tất. Vui lòng mở ví để xem thông tin đối soát giao dịch.", Rows(("Số tiền", Money(e.Amount)), ("Mã yêu cầu", e.WithdrawalId.ToString())), "Xem giao dịch rút tiền"),
            WithdrawalFailedEvent e => new Content("Yêu cầu rút tiền chưa thành công", "Yêu cầu chưa thể hoàn tất. Số tiền đã được trả về số dư khả dụng trong ví của bạn.", Rows(("Số tiền", Money(e.Amount)), ("Lý do", e.Reason), ("Mã yêu cầu", e.WithdrawalId.ToString())), "Kiểm tra ví"),
            ReviewCreatedEvent e => new Content("Bạn có đánh giá mới từ học viên", "Một học viên vừa gửi đánh giá về trải nghiệm học. Bạn có thể mở hồ sơ để xem nội dung và phản hồi.", Rows(("Điểm đánh giá", $"{e.Rating}/5")), "Xem đánh giá"),
            DisputeCreatedEvent e => new Content("Đã mở khiếu nại về buổi học", "Một khiếu nại liên quan đến hợp đồng của bạn đã được mở. Vui lòng xem nội dung và bổ sung giải trình hoặc bằng chứng để TutorHub xem xét.", Rows(("Mã khiếu nại", e.DisputeId.ToString()), ("Mã hợp đồng", e.EnrollmentId.ToString())), "Xem nội dung khiếu nại"),
            DisputeResolvedEvent e => new Content("Khiếu nại đã có kết quả xử lý", "TutorHub đã ghi nhận kết quả xử lý khiếu nại. Vui lòng xem kết luận và các khoản học phí liên quan trong chi tiết.", Rows(("Kết quả", Resolution(e.Resolution)), ("Mã khiếu nại", e.DisputeId.ToString())), "Xem kết quả xử lý"),
            ReportCreatedEvent => new Content("Thông báo về hoạt động tài khoản", "Một báo cáo liên quan đến hoạt động của bạn đã được gửi đến TutorHub để xem xét. Bạn có thể mở thông báo để theo dõi thông tin liên quan.", Rows(), "Xem thông báo"),
            ReportResolvedEvent e => new Content("Báo cáo đã được xử lý", "TutorHub đã ghi nhận kết quả xem xét báo cáo. Vui lòng mở chi tiết để đọc kết luận và hướng dẫn liên quan.", Rows(("Kết luận", e.Resolution)), "Xem kết quả"),
            StudentTopUpRequestedEvent e => new Content("Có yêu cầu nạp tiền cần xử lý", "Một học viên vừa gửi yêu cầu nạp tiền. Vui lòng mở chi tiết và đối chiếu thông tin trước khi xử lý.", Rows(("Số tiền", Money(e.Amount)), ("Nội dung chuyển tiền", e.TransferReference)), "Xem yêu cầu nạp tiền"),
            StudentTopUpConfirmedEvent e => new Content("Nạp tiền vào ví thành công", "Khoản nạp tiền đã được xác nhận và cộng vào Ví học viên của bạn.", Rows(("Số tiền đã nạp", Money(e.Amount)), ("Mã yêu cầu", e.TopUpRequestId.ToString())), "Kiểm tra số dư ví"),
            StudentTopUpRejectedEvent e => new Content("Yêu cầu nạp tiền chưa được xác nhận", "Yêu cầu nạp tiền của bạn chưa được chấp nhận. Hãy kiểm tra phản hồi và thông tin giao dịch trong ví.", Rows(("Lý do", e.Reason), ("Mã yêu cầu", e.TopUpRequestId.ToString())), "Xem yêu cầu nạp tiền"),
            StudentWalletPaymentSucceededEvent e => new Content("Thanh toán gói học bằng ví thành công", "TutorHub đã ghi nhận thanh toán từ Ví học viên. Bạn có thể xem giao dịch và mở lộ trình của gói học vừa mua.", Rows(("Số tiền thanh toán", Money(e.Amount)), ("Mã đơn đặt chỗ", e.BookingId.ToString())), "Xem giao dịch thanh toán"),
            StudentWithdrawalRequestedEvent e => new Content("Có yêu cầu rút tiền của học viên", "Một học viên vừa gửi yêu cầu rút tiền. Vui lòng kiểm tra thông tin và xử lý theo quy trình của TutorHub.", Rows(("Số tiền", Money(e.Amount)), ("Mã yêu cầu", e.WithdrawalId.ToString())), "Xem yêu cầu rút tiền"),
            StudentWithdrawalCompletedEvent e => new Content("Yêu cầu rút tiền đã hoàn tất", "Yêu cầu rút tiền của bạn đã được ghi nhận hoàn tất. Bạn có thể kiểm tra thông tin đối soát trong Ví học viên.", Rows(("Số tiền", Money(e.Amount)), ("Mã yêu cầu", e.WithdrawalId.ToString())), "Xem giao dịch rút tiền"),
            StudentWithdrawalFailedEvent e => new Content("Yêu cầu rút tiền chưa thành công", "Yêu cầu chưa thể hoàn tất. Số tiền đã được trả về số dư khả dụng trong Ví học viên.", Rows(("Số tiền", Money(e.Amount)), ("Lý do", e.Reason), ("Mã yêu cầu", e.WithdrawalId.ToString())), "Kiểm tra ví"),
            _ => new Content("Bạn có thông báo mới từ TutorHub", "Thông tin liên quan đến tài khoản của bạn vừa được cập nhật. Vui lòng mở TutorHub để xem chi tiết.", Rows(), "Xem thông báo")
        };

        // The resolved notification link remains the source of truth, including role-specific links.
        if (notification is TutorApplicationApprovedEvent or TutorApplicationRejectedEvent) path = "/tutor/application";
        return EmailTemplates.Message(content.Title, name, content.Title, content.Summary,
            content.Details.Append(("Thời gian ghi nhận", EmailTemplates.VietnamTime(notification.OccurredAt))),
            string.IsNullOrWhiteSpace(path) ? "/app/notifications" : path, content.Action, content.Notice);
    }

    private static string Resolution(string value) => value switch
    {
        "StudentWinsFullRefund" => "Hoàn toàn bộ học phí của buổi học cho học viên",
        "StudentWinsPartialRefund" => "Hoàn một phần học phí cho học viên theo kết luận xử lý",
        "TutorWinsReleaseEarning" => "Giải ngân học phí của buổi học cho gia sư",
        "DismissedNoFinancialChange" => "Đóng khiếu nại, không điều chỉnh học phí",
        _ => "Vui lòng xem kết luận trong chi tiết khiếu nại"
    };
}
