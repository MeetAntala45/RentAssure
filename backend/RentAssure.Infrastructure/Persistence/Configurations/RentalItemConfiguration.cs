using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentAssure.Domain.Entities;

namespace RentAssure.Infrastructure.Persistence.Configurations;

public class RentalItemConfiguration : IEntityTypeConfiguration<RentalItem>
{
    public void Configure(EntityTypeBuilder<RentalItem> builder)
    {
        builder.ToTable("rental_items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(i => i.Description)
            .IsRequired();

        builder.Property(i => i.Brand)
            .HasMaxLength(100);

        builder.Property(i => i.Model)
            .HasMaxLength(100);

        builder.Property(i => i.Condition)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(i => i.MonthlyRent)
            .HasPrecision(18, 2);

        builder.Property(i => i.SecurityDeposit)
            .HasPrecision(18, 2);

        builder.Property(i => i.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(i => i.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(i => i.Area)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasOne(i => i.Category)
            .WithMany(c => c.RentalItems)
            .HasForeignKey(i => i.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
