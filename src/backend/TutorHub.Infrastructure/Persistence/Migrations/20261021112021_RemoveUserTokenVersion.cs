using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUserTokenVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TokenVersion",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TokenVersion",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
