using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentAssure.Domain.Entities;

namespace RentAssure.Infrastructure.Persistence.Configurations;

public class PlatformSettingConfiguration : IEntityTypeConfiguration<PlatformSetting>
{
    public void Configure(EntityTypeBuilder<PlatformSetting> builder)
    {
        builder.ToTable("platform_settings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.SettingKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(s => s.SettingKey)
            .IsUnique();

        builder.Property(s => s.SettingValue)
            .IsRequired();

        builder.Property(s => s.Group)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(s => s.Description)
            .HasMaxLength(300);
    }
}
