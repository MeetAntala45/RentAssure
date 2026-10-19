using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentAssure.Domain.Entities;

namespace RentAssure.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("bookings");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.BookingReference)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(b => b.BookingReference)
            .IsUnique();

        builder.Property(b => b.MonthlyRent)
            .HasPrecision(18, 2);

        builder.Property(b => b.SecurityDeposit)
            .HasPrecision(18, 2);

        builder.Property(b => b.TotalAmountPaid)
            .HasPrecision(18, 2);

        builder.Property(b => b.PlatformCommissionAmount)
            .HasPrecision(18, 2);

        builder.Property(b => b.VendorPayoutAmount)
            .HasPrecision(18, 2);

        builder.Property(b => b.CommissionRateApplied)
            .HasPrecision(5, 2);

        builder.Property(b => b.DepositRefundedAmount)
            .HasPrecision(18, 2);

        builder.Property(b => b.DepositDeductedAmount)
            .HasPrecision(18, 2);

        builder.Property(b => b.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(b => b.DepositStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(b => b.DeliveryAddress)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(b => b.DeliveryCity)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasOne(b => b.Item)
            .WithMany(i => i.Bookings)
            .HasForeignKey(b => b.ItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
