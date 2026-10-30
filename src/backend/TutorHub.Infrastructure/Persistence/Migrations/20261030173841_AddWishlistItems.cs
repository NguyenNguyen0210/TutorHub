using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWishlistItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "wishlist_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemType = table.Column<int>(type: "integer", nullable: false),
                    TutorProfileId = table.Column<Guid>(type: "uuid", nullable: true),
                    ServiceId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wishlist_items", x => x.Id);
                    table.CheckConstraint("CK_wishlist_items_type_target", "(\"ItemType\" = 1 AND \"TutorProfileId\" IS NOT NULL AND \"ServiceId\" IS NULL) OR (\"ItemType\" = 2 AND \"ServiceId\" IS NOT NULL AND \"TutorProfileId\" IS NULL)");
                    table.ForeignKey(
                        name: "FK_wishlist_items_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_wishlist_items_TutorProfiles_TutorProfileId",
                        column: x => x.TutorProfileId,
                        principalTable: "TutorProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_wishlist_items_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_wishlist_items_ServiceId",
                table: "wishlist_items",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_wishlist_items_TutorProfileId",
                table: "wishlist_items",
                column: "TutorProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_wishlist_items_UserId_ServiceId",
                table: "wishlist_items",
                columns: new[] { "UserId", "ServiceId" },
                unique: true,
                filter: "\"ServiceId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_wishlist_items_UserId_TutorProfileId",
                table: "wishlist_items",
                columns: new[] { "UserId", "TutorProfileId" },
                unique: true,
                filter: "\"TutorProfileId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "wishlist_items");
        }
    }
}
