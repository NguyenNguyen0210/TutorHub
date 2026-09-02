using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Conversations.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Conversations.GetOrCreateConversation;

public class GetOrCreateConversationCommandHandler : IRequestHandler<GetOrCreateConversationCommand, ConversationDto>
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public GetOrCreateConversationCommandHandler(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<ConversationDto> Handle(GetOrCreateConversationCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;
        if (currentUserId == request.TargetUserId)
        {
            throw new BadRequestException("Cannot create a conversation with yourself.");
        }

        var currentUser = await _dbContext.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.TutorProfile)
            .FirstOrDefaultAsync(u => u.Id == currentUserId, cancellationToken);

        if (currentUser == null)
        {
            throw new UnauthorizedException("User record not found.");
        }

        var targetUser = await _dbContext.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.TutorProfile)
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken);

        if (targetUser == null)
        {
            throw new NotFoundException($"Target user with ID '{request.TargetUserId}' not found.");
        }

        // Canonicalize roles: exactly 1 student profile and 1 tutor profile
        Guid studentProfileId;
        Guid tutorProfileId;

        if (currentUser.Role == UserRole.Student && targetUser.Role == UserRole.Tutor)
        {
            if (currentUser.StudentProfile == null)
                throw new BadRequestException("Current user student profile is missing.");
            if (targetUser.TutorProfile == null)
                throw new BadRequestException("Target tutor profile is missing.");

            studentProfileId = currentUser.StudentProfile.Id;
            tutorProfileId = targetUser.TutorProfile.Id;
        }
        else if (currentUser.Role == UserRole.Tutor && targetUser.Role == UserRole.Student)
        {
            if (currentUser.TutorProfile == null)
                throw new BadRequestException("Current user tutor profile is missing.");
            if (targetUser.StudentProfile == null)
                throw new BadRequestException("Target student profile is missing.");

            studentProfileId = targetUser.StudentProfile.Id;
            tutorProfileId = currentUser.TutorProfile.Id;
        }
        else if (currentUser.StudentProfile != null && targetUser.TutorProfile != null)
        {
            studentProfileId = currentUser.StudentProfile.Id;
            tutorProfileId = targetUser.TutorProfile.Id;
        }
        else if (currentUser.TutorProfile != null && targetUser.StudentProfile != null)
        {
            studentProfileId = targetUser.StudentProfile.Id;
            tutorProfileId = currentUser.TutorProfile.Id;
        }
        else
        {
            throw new BadRequestException("A conversation can only be created between a student and a tutor.");
        }

        // Check if existing conversation exists
        var conversation = await _dbContext.Conversations
            .Include(c => c.StudentProfile).ThenInclude(sp => sp.User)
            .Include(c => c.TutorProfile).ThenInclude(tp => tp.User)
            .FirstOrDefaultAsync(c => c.StudentProfileId == studentProfileId && c.TutorProfileId == tutorProfileId, cancellationToken);

        if (conversation != null)
        {
            return MapToDto(conversation, currentUserId);
        }

        var studentProfile = currentUser.StudentProfile?.Id == studentProfileId ? currentUser.StudentProfile : targetUser.StudentProfile;
        var tutorProfile = currentUser.TutorProfile?.Id == tutorProfileId ? currentUser.TutorProfile : targetUser.TutorProfile;

        // Try creating new conversation with concurrency retry (catch unique violation)
        var newConversation = new Conversation
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfileId,
            StudentProfile = studentProfile!,
            TutorProfileId = tutorProfileId,
            TutorProfile = tutorProfile!,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Conversations.Add(newConversation);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Race condition: another thread/worker created it concurrently
            _dbContext.Conversations.Entry(newConversation).State = EntityState.Detached;
            newConversation = await _dbContext.Conversations
                .Include(c => c.StudentProfile).ThenInclude(sp => sp.User)
                .Include(c => c.TutorProfile).ThenInclude(tp => tp.User)
                .FirstAsync(c => c.StudentProfileId == studentProfileId && c.TutorProfileId == tutorProfileId, cancellationToken);
            
            return MapToDto(newConversation, currentUserId);
        }

        return MapToDto(newConversation, currentUserId);
    }

    private static ConversationDto MapToDto(Conversation conversation, Guid currentUserId)
    {
        return new ConversationDto
        {
            Id = conversation.Id,
            StudentProfileId = conversation.StudentProfileId,
            StudentUserId = conversation.StudentProfile?.UserId ?? Guid.Empty,
            StudentName = conversation.StudentProfile?.User?.FullName ?? string.Empty,
            StudentAvatarUrl = conversation.StudentProfile?.User?.AvatarUrl,
            TutorProfileId = conversation.TutorProfileId,
            TutorUserId = conversation.TutorProfile?.UserId ?? Guid.Empty,
            TutorName = conversation.TutorProfile?.User?.FullName ?? string.Empty,
            TutorAvatarUrl = conversation.TutorProfile?.User?.AvatarUrl,
            CreatedAt = conversation.CreatedAt,
            LastMessageId = conversation.LastMessageId,
            LastMessageAt = conversation.LastMessageAt,
            LastMessagePreview = conversation.LastMessagePreview,
            UnreadCount = 0
        };
    }
}
