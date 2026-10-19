using RentAssure.Domain.Common;

namespace RentAssure.Domain.Entities;

public class PlatformSetting : BaseEntity
{
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string Group { get; set; } = "General"; // Financial, Operations, Policy, General
    public string Description { get; set; } = string.Empty;
}
