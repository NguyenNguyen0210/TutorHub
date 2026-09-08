using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Infrastructure.Services;

public class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}
