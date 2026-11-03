using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.DTOs;

public static class ApplicationDocuments
{
    public static async Task<string?> ResolveAsync(IAppDbContext context, Guid userId,
        List<Guid>? documentIds, string? legacyJson, CancellationToken ct)
    {
        if (documentIds is null) return legacyJson;
        if (documentIds.Count > 20) throw new BadRequestException("Tối đa 20 tài liệu cho một hồ sơ.");
        var ids = documentIds.Distinct().ToList();
        if (ids.Count == 0) return "[]";
        var files = await context.Media.AsNoTracking().Where(m =>
            ids.Contains(m.Id) && m.UploadedByUserId == userId &&
            m.Status == MediaStatus.Active && m.MediaType == MediaType.Certificate).ToListAsync(ct);
        if (files.Count != ids.Count)
            throw new BadRequestException("Tài liệu phải là chứng chỉ đã tải lên thuộc tài khoản của bạn.");
        return JsonSerializer.Serialize(files.Select(m => new {
            id = m.Id, mediaId = m.Id, title = m.OriginalFileName,
            format = m.ContentType, sizeBytes = m.FileSize
        }));
    }
}
