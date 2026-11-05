using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RentAssure.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddItemTenureDiscounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Discount12MonthsPercent",
                table: "rental_items",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Discount6MonthsPercent",
                table: "rental_items",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Discount12MonthsPercent",
                table: "rental_items");

            migrationBuilder.DropColumn(
                name: "Discount6MonthsPercent",
                table: "rental_items");
        }
    }
}
