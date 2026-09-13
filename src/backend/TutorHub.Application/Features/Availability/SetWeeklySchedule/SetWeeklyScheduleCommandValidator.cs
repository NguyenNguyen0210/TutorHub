using FluentValidation;

namespace TutorHub.Application.Features.Availability.SetWeeklySchedule;

public class SetWeeklyScheduleCommandValidator : AbstractValidator<SetWeeklyScheduleCommand>
{
    public SetWeeklyScheduleCommandValidator()
    {
        RuleFor(x => x.Schedule)
            .NotNull()
            .WithMessage("Schedule cannot be null.");

        RuleForEach(x => x.Schedule).ChildRules(item =>
        {
            item.RuleFor(s => s.StartTime)
                .LessThan(s => s.EndTime)
                .WithMessage("StartTime must be strictly earlier than EndTime.");
        });

        // Intra-day non-overlap validation (INV-AVAIL-003)
        RuleFor(x => x.Schedule)
            .Must(HaveNoIntraDayOverlaps)
            .WithMessage("Weekly schedule contains overlapping time windows on the same day.")
            .When(x => x.Schedule != null);
    }

    private static bool HaveNoIntraDayOverlaps(List<DTOs.WeeklyScheduleItemDto> schedule)
    {
        var groupedByDay = schedule.GroupBy(s => s.DayOfWeek);

        foreach (var group in groupedByDay)
        {
            var daySlots = group.OrderBy(s => s.StartTime).ToList();
            for (int i = 0; i < daySlots.Count; i++)
            {
                for (int j = i + 1; j < daySlots.Count; j++)
                {
                    var a = daySlots[i];
                    var b = daySlots[j];

                    // Check overlap: a.StartTime < b.EndTime && b.StartTime < a.EndTime
                    if (a.StartTime < b.EndTime && b.StartTime < a.EndTime)
                    {
                        return false;
                    }
                }
            }
        }

        return true;
    }
}
