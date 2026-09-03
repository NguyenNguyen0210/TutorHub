using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorReportToTrustAndSafety : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Bookings_BookingId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_BookingId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_SessionId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Reports_BookingId_ReporterUserId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_TutorProfileId_StartAt_EndAt_Status",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Booking_Price",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Booking_TimeRange",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "OverridePrice",
                table: "TutorSubjects");

            migrationBuilder.DropColumn(
                name: "HourlyRate",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "EndAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "HourlyRate",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "StartAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "TotalAmount",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "RejectionReason",
                table: "Withdrawals",
                newName: "FailureReason");

            migrationBuilder.AddColumn<string>(
                name: "BankCode",
                table: "Withdrawals",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessingStartedAt",
                table: "Withdrawals",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ProcessingStartedByAdminId",
                table: "Withdrawals",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HeldBalance",
                table: "Wallets",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "AccountHolderName",
                table: "TutorProfiles",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccountNumber",
                table: "TutorProfiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankCode",
                table: "TutorProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "TutorProfiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BookingId1",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Transactions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DisputeId",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RelatedTransactionId",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SettlementRequired",
                table: "Transactions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Transactions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "AttendanceVerificationDueAt",
                table: "Sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AttendanceVerificationOpenedAt",
                table: "Sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AttendanceVerifiedAt",
                table: "Sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasAttendanceConflict",
                table: "Sessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ResolutionNotes",
                table: "Sessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResolutionSource",
                table: "Sessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ResolvedByAdminId",
                table: "Sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StudentAttendance",
                table: "Sessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StudentAttendanceSubmittedAt",
                table: "Sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TutorAttendance",
                table: "Sessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TutorAttendanceSubmittedAt",
                table: "Sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "BookingId",
                table: "Reports",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "ReportType",
                table: "Reports",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ReportedUserId",
                table: "Reports",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetId",
                table: "Reports",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FeePolicyVersion",
                table: "Enrollments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformFeeRate",
                table: "Enrollments",
                type: "numeric(5,4)",
                precision: 5,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OldValuesJson = table.Column<string>(type: "text", nullable: true),
                    NewValuesJson = table.Column<string>(type: "text", nullable: true),
                    CorrelationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    TutorProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastMessageId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastMessagePreview = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Conversations_StudentProfiles_StudentProfileId",
                        column: x => x.StudentProfileId,
                        principalTable: "StudentProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Conversations_TutorProfiles_TutorProfileId",
                        column: x => x.TutorProfileId,
                        principalTable: "TutorProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Disputes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    InitiatorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RespondentUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ResolutionDecision = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AdminNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ResolvedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResolutionSource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    HeldAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    HoldType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    HoldStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    HeldAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    HoldReleasedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OriginalTransactionId = table.Column<Guid>(type: "uuid", nullable: true),
                    AffectsFinancialResolution = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Disputes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Disputes_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Disputes_Users_InitiatorUserId",
                        column: x => x.InitiatorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Disputes_Users_RespondentUserId",
                        column: x => x.RespondentUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InboxMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsumerName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboxMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Type = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    DeepLink = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsCritical = table.Column<bool>(type: "boolean", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeduplicationKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OutboxMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    EventVersion = table.Column<int>(type: "integer", nullable: false),
                    AggregateType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    AggregateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: false),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeadLetteredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockedUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    NextAttemptAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    LastError = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlatformSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CurrentVersion = table.Column<int>(type: "integer", nullable: false),
                    LastUpdatedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WalletTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WalletId = table.Column<Guid>(type: "uuid", nullable: false),
                    WithdrawalId = table.Column<Guid>(type: "uuid", nullable: true),
                    DisputeId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalletTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Wallets_WalletId",
                        column: x => x.WalletId,
                        principalTable: "Wallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Withdrawals_WithdrawalId",
                        column: x => x.WithdrawalId,
                        principalTable: "Withdrawals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    AttachmentKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AttachmentName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AttachmentContentType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    AttachmentSize = table.Column<long>(type: "bigint", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Messages_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Messages_Users_SenderUserId",
                        column: x => x.SenderUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DisputeEvidences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DisputeId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    FileUrl = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DisputeEvidences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DisputeEvidences_Disputes_DisputeId",
                        column: x => x.DisputeId,
                        principalTable: "Disputes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DisputeEvidences_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EmailDeliveries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NotificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Subject = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    NextAttemptAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "text", nullable: true),
                    ProviderMessageId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    LockedUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailDeliveries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailDeliveries_Notifications_NotificationId",
                        column: x => x.NotificationId,
                        principalTable: "Notifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlatformSettingVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformSettingId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ChangedByAdminId = table.Column<Guid>(type: "uuid", nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformSettingVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformSettingVersions_PlatformSettings_PlatformSettingId",
                        column: x => x.PlatformSettingId,
                        principalTable: "PlatformSettings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Withdrawals_ProcessingStartedByAdminId",
                table: "Withdrawals",
                column: "ProcessingStartedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_BookingId",
                table: "Transactions",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_BookingId1",
                table: "Transactions",
                column: "BookingId1",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_DisputeId",
                table: "Transactions",
                column: "DisputeId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_RelatedTransactionId",
                table: "Transactions",
                column: "RelatedTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_SessionId",
                table: "Transactions",
                column: "SessionId",
                unique: true,
                filter: "\"SessionId\" IS NOT NULL AND \"Type\" = 'SessionPayoutCredit'");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_BookingId",
                table: "Reports",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_CreatedAt",
                table: "Reports",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_ReportedUserId",
                table: "Reports",
                column: "ReportedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_ReportType",
                table: "Reports",
                column: "ReportType");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TutorProfileId_Status",
                table: "Bookings",
                columns: new[] { "TutorProfileId", "Status" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Booking_TotalPrice",
                table: "Bookings",
                sql: "\"TotalPrice\" >= 0 AND \"TotalSessions\" > 0 AND \"SessionDurationMinutes\" > 0");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CorrelationId",
                table: "AuditLogs",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CreatedAt",
                table: "AuditLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityName_EntityId",
                table: "AuditLogs",
                columns: new[] { "EntityName", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_Participants",
                table: "Conversations",
                columns: new[] { "StudentProfileId", "TutorProfileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_Student",
                table: "Conversations",
                columns: new[] { "StudentProfileId", "LastMessageAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_Tutor",
                table: "Conversations",
                columns: new[] { "TutorProfileId", "LastMessageAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_DisputeEvidences_DisputeId",
                table: "DisputeEvidences",
                column: "DisputeId");

            migrationBuilder.CreateIndex(
                name: "IX_DisputeEvidences_UploadedByUserId",
                table: "DisputeEvidences",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_InitiatorUserId",
                table: "Disputes",
                column: "InitiatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_OriginalTransactionId",
                table: "Disputes",
                column: "OriginalTransactionId",
                unique: true,
                filter: "\"AffectsFinancialResolution\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_RespondentUserId",
                table: "Disputes",
                column: "RespondentUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_SessionId",
                table: "Disputes",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_Status",
                table: "Disputes",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_EmailDeliveries_Dispatch",
                table: "EmailDeliveries",
                columns: new[] { "Status", "NextAttemptAt", "LockedUntil" });

            migrationBuilder.CreateIndex(
                name: "IX_EmailDeliveries_Notification",
                table: "EmailDeliveries",
                column: "NotificationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InboxMessages_ConsumerEvent",
                table: "InboxMessages",
                columns: new[] { "ConsumerName", "EventId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ConversationFeed",
                table: "Messages",
                columns: new[] { "ConversationId", "CreatedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Messages_SenderUserId",
                table: "Messages",
                column: "SenderUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Dedup",
                table: "Notifications",
                columns: new[] { "UserId", "Type", "DeduplicationKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UnreadCount",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserFeed",
                table: "Notifications",
                columns: new[] { "UserId", "CreatedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessages_Dispatch",
                table: "OutboxMessages",
                columns: new[] { "Status", "NextAttemptAt", "LockedUntil" });

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessages_EventId",
                table: "OutboxMessages",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlatformSettings_Key",
                table: "PlatformSettings",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlatformSettingVersions_PlatformSettingId_Version",
                table: "PlatformSettingVersions",
                columns: new[] { "PlatformSettingId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_WalletId_CreatedAt",
                table: "WalletTransactions",
                columns: new[] { "WalletId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_WithdrawalId",
                table: "WalletTransactions",
                column: "WithdrawalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Bookings_BookingId",
                table: "Reports",
                column: "BookingId",
                principalTable: "Bookings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Users_ReportedUserId",
                table: "Reports",
                column: "ReportedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Bookings_BookingId1",
                table: "Transactions",
                column: "BookingId1",
                principalTable: "Bookings",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Transactions_RelatedTransactionId",
                table: "Transactions",
                column: "RelatedTransactionId",
                principalTable: "Transactions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Withdrawals_Users_ProcessingStartedByAdminId",
                table: "Withdrawals",
                column: "ProcessingStartedByAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Bookings_BookingId",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Users_ReportedUserId",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Bookings_BookingId1",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Transactions_RelatedTransactionId",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Withdrawals_Users_ProcessingStartedByAdminId",
                table: "Withdrawals");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "DisputeEvidences");

            migrationBuilder.DropTable(
                name: "EmailDeliveries");

            migrationBuilder.DropTable(
                name: "InboxMessages");

            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "OutboxMessages");

            migrationBuilder.DropTable(
                name: "PlatformSettingVersions");

            migrationBuilder.DropTable(
                name: "WalletTransactions");

            migrationBuilder.DropTable(
                name: "Disputes");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Conversations");

            migrationBuilder.DropTable(
                name: "PlatformSettings");

            migrationBuilder.DropIndex(
                name: "IX_Withdrawals_ProcessingStartedByAdminId",
                table: "Withdrawals");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_BookingId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_BookingId1",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_DisputeId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_RelatedTransactionId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_SessionId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Reports_BookingId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_CreatedAt",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_ReportedUserId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_ReportType",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_TutorProfileId_Status",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Booking_TotalPrice",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "BankCode",
                table: "Withdrawals");

            migrationBuilder.DropColumn(
                name: "ProcessingStartedAt",
                table: "Withdrawals");

            migrationBuilder.DropColumn(
                name: "ProcessingStartedByAdminId",
                table: "Withdrawals");

            migrationBuilder.DropColumn(
                name: "HeldBalance",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "AccountHolderName",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "AccountNumber",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "BankCode",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "BookingId1",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "DisputeId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "RelatedTransactionId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "SettlementRequired",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "AttendanceVerificationDueAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "AttendanceVerificationOpenedAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "AttendanceVerifiedAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "HasAttendanceConflict",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ResolutionNotes",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ResolutionSource",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ResolvedByAdminId",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "StudentAttendance",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "StudentAttendanceSubmittedAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TutorAttendance",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TutorAttendanceSubmittedAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ReportType",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ReportedUserId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "TargetId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "FeePolicyVersion",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "PlatformFeeRate",
                table: "Enrollments");

            migrationBuilder.RenameColumn(
                name: "FailureReason",
                table: "Withdrawals",
                newName: "RejectionReason");

            migrationBuilder.AddColumn<decimal>(
                name: "OverridePrice",
                table: "TutorSubjects",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyRate",
                table: "TutorProfiles",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<Guid>(
                name: "BookingId",
                table: "Reports",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyRate",
                table: "Bookings",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAmount",
                table: "Bookings",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_BookingId",
                table: "Transactions",
                column: "BookingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_SessionId",
                table: "Transactions",
                column: "SessionId",
                unique: true,
                filter: "\"SessionId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_BookingId_ReporterUserId",
                table: "Reports",
                columns: new[] { "BookingId", "ReporterUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TutorProfileId_StartAt_EndAt_Status",
                table: "Bookings",
                columns: new[] { "TutorProfileId", "StartAt", "EndAt", "Status" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Booking_Price",
                table: "Bookings",
                sql: "\"HourlyRate\" >= 0 AND \"TotalAmount\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Booking_TimeRange",
                table: "Bookings",
                sql: "\"StartAt\" < \"EndAt\"");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Bookings_BookingId",
                table: "Reports",
                column: "BookingId",
                principalTable: "Bookings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
