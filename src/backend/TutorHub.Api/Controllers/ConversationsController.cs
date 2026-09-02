using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Conversations.DTOs;
using TutorHub.Application.Features.Conversations.GetConversationMessages;
using TutorHub.Application.Features.Conversations.GetMyConversations;
using TutorHub.Application.Features.Conversations.GetOrCreateConversation;
using TutorHub.Application.Features.Conversations.MarkConversationAsRead;
using TutorHub.Application.Features.Conversations.SendMessage;

namespace TutorHub.Api.Controllers;

[ApiController]
[Route("api/v1/conversations")]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly ISender _sender;
    private readonly IFileStorage _fileStorage;
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public ConversationsController(
        ISender sender,
        IFileStorage fileStorage,
        IAppDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _sender = sender;
        _fileStorage = fileStorage;
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Get or create a 1-to-1 conversation with target user.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ConversationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOrCreateConversation(
        [FromBody] GetOrCreateConversationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetOrCreateConversationCommand(request.TargetUserId), cancellationToken);
        return Ok(ApiResponse<ConversationDto>.SuccessResult(result, "Conversation retrieved successfully."));
    }

    /// <summary>
    /// Get my conversations list with keyset cursor pagination.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<CursorPagedResult<ConversationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyConversations(
        [FromQuery] string? cursor,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetMyConversationsQuery(cursor, pageSize), cancellationToken);
        return Ok(ApiResponse<CursorPagedResult<ConversationDto>>.SuccessResult(result));
    }

    /// <summary>
    /// Get messages in a conversation with keyset cursor pagination.
    /// </summary>
    [HttpGet("{id:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<CursorPagedResult<MessageDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConversationMessages(
        [FromRoute] Guid id,
        [FromQuery] string? cursor,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetConversationMessagesQuery(id, cursor, pageSize), cancellationToken);
        return Ok(ApiResponse<CursorPagedResult<MessageDto>>.SuccessResult(result));
    }

    /// <summary>
    /// Send a message in a conversation.
    /// </summary>
    [HttpPost("{id:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<MessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendMessage(
        [FromRoute] Guid id,
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken)
    {
        var command = new SendMessageCommand(
            id,
            request.Content,
            request.AttachmentKey,
            request.AttachmentName,
            request.AttachmentContentType,
            request.AttachmentSize);

        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<MessageDto>.SuccessResult(result, "Message sent successfully."));
    }

    /// <summary>
    /// Upload an attachment file for a conversation message.
    /// </summary>
    [HttpPost("{id:guid}/messages/attachment")]
    [ProducesResponseType(typeof(ApiResponse<AttachmentUploadResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadAttachment(
        [FromRoute] Guid id,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        var conversation = await _dbContext.Conversations
            .Include(c => c.StudentProfile)
            .Include(c => c.TutorProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (conversation == null)
        {
            throw new NotFoundException($"Conversation with ID '{id}' not found.");
        }

        var isStudent = conversation.StudentProfile != null && conversation.StudentProfile.UserId == currentUserId;
        var isTutor = conversation.TutorProfile != null && conversation.TutorProfile.UserId == currentUserId;

        if (!isStudent && !isTutor)
        {
            throw new ForbiddenException("You are not authorized to upload attachments to this conversation.");
        }

        if (file == null || file.Length == 0)
        {
            throw new BadRequestException("No file provided.");
        }

        if (file.Length > IFileStorage.MaxAttachmentSizeBytes)
        {
            throw new BadRequestException($"File size exceeds maximum limit of {IFileStorage.MaxAttachmentSizeBytes / (1024 * 1024)} MB.");
        }

        var contentType = file.ContentType.ToLowerInvariant();
        if (!IFileStorage.AllowedMimeTypes.Contains(contentType))
        {
            throw new BadRequestException("Unsupported file format. Allowed formats: JPEG, PNG, GIF, PDF.");
        }

        using var stream = file.OpenReadStream();
        var storageKey = await _fileStorage.SaveAsync(stream, file.FileName, contentType, cancellationToken);

        var result = new AttachmentUploadResult
        {
            StorageKey = storageKey,
            FileName = Path.GetFileName(file.FileName),
            ContentType = contentType,
            Size = file.Length
        };

        return Ok(ApiResponse<AttachmentUploadResult>.SuccessResult(result, "File uploaded successfully."));
    }

    /// <summary>
    /// Download/access an attachment file for a conversation message.
    /// </summary>
    [HttpGet("{id:guid}/messages/attachments/{storageKey}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAttachment(
        [FromRoute] Guid id,
        [FromRoute] string storageKey,
        CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;

        var conversation = await _dbContext.Conversations
            .Include(c => c.StudentProfile)
            .Include(c => c.TutorProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (conversation == null)
        {
            throw new NotFoundException($"Conversation with ID '{id}' not found.");
        }

        var isStudent = conversation.StudentProfile != null && conversation.StudentProfile.UserId == currentUserId;
        var isTutor = conversation.TutorProfile != null && conversation.TutorProfile.UserId == currentUserId;
        var isAdmin = _currentUserService.Role == "Admin";

        if (!isStudent && !isTutor && !isAdmin)
        {
            throw new ForbiddenException("You are not authorized to download attachments from this conversation.");
        }

        var stream = await _fileStorage.GetAsync(storageKey, cancellationToken);
        if (stream == null)
        {
            throw new NotFoundException("Attachment file not found.");
        }

        return File(stream, "application/octet-stream", storageKey);
    }

    /// <summary>
    /// Mark all unread incoming messages in a conversation as read.
    /// </summary>
    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new MarkConversationAsReadCommand(id), cancellationToken);
        return Ok(ApiResponse<int>.SuccessResult(result, $"{result} messages marked as read."));
    }
}

public class GetOrCreateConversationRequest
{
    public Guid TargetUserId { get; set; }
}

public class SendMessageRequest
{
    public string Content { get; set; } = string.Empty;
    public string? AttachmentKey { get; set; }
    public string? AttachmentName { get; set; }
    public string? AttachmentContentType { get; set; }
    public long? AttachmentSize { get; set; }
}

public class AttachmentUploadResult
{
    public string StorageKey { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
}
