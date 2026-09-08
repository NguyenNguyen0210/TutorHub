namespace TutorHub.Domain.Enums;

public enum BookingStatus
{
    // Package-model lifecycle (refactor wave 3): checkout hold → paid →
    // terminal. Post-payment progress lives on Enrollment/Session, never here.
    // Pending/Confirmed/Completed were single-slot legacy states and are gone;
    // Paid is the single canonical post-payment state.
    Holding,     // giữ chỗ tạm 15 phút chờ thanh toán
    Paid,        // đã thanh toán, escrow held, Enrollment đã sinh
    Cancelled,   // bị hủy (học viên / hệ thống / hết hạn giữ chỗ)
    Expired      // giữ chỗ quá hạn không pay (do BookingTimeout job set)
}
