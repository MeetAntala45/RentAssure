using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentAssure.Domain.Entities;

namespace RentAssure.Infrastructure.Persistence.Configurations;

public class RentalReviewConfiguration : IEntityTypeConfiguration<RentalReview>
{
    public void Configure(EntityTypeBuilder<RentalReview> builder)
    {
        builder.ToTable("rental_reviews");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.Comment)
            .HasMaxLength(1500);

        builder.HasOne(r => r.Booking)
            .WithOne(b => b.Review)
            .HasForeignKey<RentalReview>(r => r.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Item)
            .WithMany(i => i.Reviews)
            .HasForeignKey(r => r.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Customer)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.BookingId).IsUnique();
        builder.HasIndex(r => r.ItemId);
    }
}
