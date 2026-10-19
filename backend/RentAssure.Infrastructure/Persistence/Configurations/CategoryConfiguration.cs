using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentAssure.Domain.Entities;

namespace RentAssure.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Slug)
            .IsRequired()
            .HasMaxLength(120);

        builder.HasIndex(c => c.Slug)
            .IsUnique();

        builder.Property(c => c.CommissionRate)
            .HasPrecision(5, 2)
            .HasDefaultValue(10.0m);

        builder.Property(c => c.IsActive)
            .HasDefaultValue(true);
    }
}
