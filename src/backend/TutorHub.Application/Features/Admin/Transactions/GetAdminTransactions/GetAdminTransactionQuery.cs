using MediatR;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Admin.Transactions.DTOs;

namespace TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;

public record GetAdminTransactionQuery(Guid Id) : IRequest<AdminTransactionDto>;

public class GetAdminTransactionQueryHandler(ISender sender) : IRequestHandler<GetAdminTransactionQuery, AdminTransactionDto>
{
    public async Task<AdminTransactionDto> Handle(GetAdminTransactionQuery request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAdminTransactionsQuery(TransactionId: request.Id), cancellationToken);
        return result.Items.SingleOrDefault() ?? throw new NotFoundException("Transaction", request.Id);
    }
}
