namespace TutorHub.Domain.Enums;

public enum ServiceStatus
{
    Draft,        // Created by tutor, not yet public
    Published,    // Active and visible on marketplace
    Unpublished   // Hidden by tutor or admin force-unpublish
}
