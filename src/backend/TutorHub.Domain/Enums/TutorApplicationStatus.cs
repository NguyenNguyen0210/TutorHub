namespace TutorHub.Domain.Enums;

public enum TutorApplicationStatus
{
    Pending,   // Submitted, awaiting Admin review
    Approved,  // Admin approved — Tutor gains marketplace capability
    Rejected   // Admin rejected — reason stored on the application record
}
