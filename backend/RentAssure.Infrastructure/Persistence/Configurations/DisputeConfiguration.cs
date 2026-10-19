using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentAssure.Domain.Entities;

namespace RentAssure.Infrastructure.Persistence.Configurations;

public class DisputeConfiguration : IEntityTypeConfiguration<Dispute>
{
    public void Configure(EntityTypeBuilder<Dispute> builder)
    {
        builder.ToTable("disputes");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.DisputeTicketNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(d => d.DisputeTicketNumber)
            .IsUnique();

        builder.Property(d => d.Reason)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(40);

        builder.Property(d => d.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(40);

        builder.Property(d => d.ClaimAmount)
            .HasPrecision(18, 2);

        builder.Property(d => d.RefundToCustomerAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0.0m);

        builder.Property(d => d.PayoutToVendorAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0.0m);

        builder.Property(d => d.Description)
            .IsRequired();

        builder.HasOne(d => d.Booking)
            .WithMany(b => b.Disputes)
            .HasForeignKey(d => d.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.ResolvedByUser)
            .WithMany()
            .HasForeignKey(d => d.ResolvedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
