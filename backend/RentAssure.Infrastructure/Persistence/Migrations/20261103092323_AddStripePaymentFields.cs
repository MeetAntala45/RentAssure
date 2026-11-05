using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentAssure.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStripePaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPaidOnline",
                table: "bookings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "StripePaymentIntentId",
                table: "bookings",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeRefundId",
                table: "bookings",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPaidOnline",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "StripePaymentIntentId",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "StripeRefundId",
                table: "bookings");
        }
    }
}
