# API documentation

[Back to TutorHub](../README.md) | [Local setup](configuration.md)

The local API base URL is `http://localhost:5129/api/v1`. [Swagger UI](http://localhost:5129/swagger) is available in Development and describes request bodies, responses, and authorization requirements.

## Authentication

1. Call `POST /api/v1/auth/login` with the email and password of a registered account.
2. Use the returned `data.accessToken` in `Authorization: Bearer <access-token>` for protected requests. In Swagger's **Authorize** dialog, paste only the token; Swagger adds the prefix.
3. Call `POST /api/v1/auth/refresh` with the refresh token when needed. Refresh tokens rotate; retain the new token pair returned by the API.
4. Call `POST /api/v1/auth/logout` with the refresh token to revoke it. Protected operations also enforce student, tutor, or administrator permissions.

## Endpoint groups

Paths below are relative to `/api/v1`; consult Swagger for individual operations and permissions.

| Group | Paths | Purpose |
| --- | --- | --- |
| Authentication | `/auth` | Registration, login, token refresh, password recovery, optional Google sign-in. |
| Discovery | `/tutors`, `/services`, `/subjects`, `/categories` | Tutor profiles, learning packages, and catalog data. |
| Learning | `/bookings`, `/enrollments`, `/sessions` | Package reservations, enrollments, and lesson scheduling. |
| Finance | `/payments`, `/wallets/me`, `/transactions`, `/disputes` | VNPay payments, wallet balances, transactions, and disputes. |
| Communication | `/conversations`, `/notifications`, `/media` | Messaging, notifications, and uploaded media. |
| Administration | `/admin` | Moderation, disputes, withdrawals, platform settings, and audit records. |

## Development payment simulator

In Development, `POST /api/v1/dev/payments/simulate-ipn` accepts a holding booking ID and a payment outcome:

```json
{
  "bookingId": "<booking-guid>",
  "success": true
}
```

The endpoint signs a VNPay-shaped callback and sends it through the payment webhook handler, exercising enrollment activation and escrow funding. It is unavailable outside Development and does not replace the VNPay or R2 startup settings. Use it with local test data.

## Further documentation

- [Functional requirements](functional-requirements.md)
- [Product requirements](prd.md)
- [User stories](user-stories.md)
- [OpenAPI snapshot](openapi.json) — use the running API's Swagger UI for its current contract.
