using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentAssure.Domain.Entities;

namespace RentAssure.Infrastructure.Persistence.Configurations;

public class VendorConfiguration : IEntityTypeConfiguration<Vendor>
{
    public void Configure(EntityTypeBuilder<Vendor> builder)
    {
        builder.ToTable("vendors");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.StoreName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(v => v.OwnerName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(v => v.BusinessRegistrationNumber)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(v => v.PhoneNumber)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(v => v.SupportEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(v => v.Address)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(v => v.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(v => v.State)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(v => v.PostalCode)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(v => v.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(v => v.CommissionRateOverride)
            .HasPrecision(5, 2);

        builder.Property(v => v.TotalEarnings)
            .HasPrecision(18, 2)
            .HasDefaultValue(0.0m);

        builder.Property(v => v.TotalCommissionPaid)
            .HasPrecision(18, 2)
            .HasDefaultValue(0.0m);

        builder.HasMany(v => v.RentalItems)
            .WithOne(i => i.Vendor)
            .HasForeignKey(i => i.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(v => v.Bookings)
            .WithOne(b => b.Vendor)
            .HasForeignKey(b => b.VendorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
