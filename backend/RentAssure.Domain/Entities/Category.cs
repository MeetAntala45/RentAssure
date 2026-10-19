using RentAssure.Domain.Common;

namespace RentAssure.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public decimal CommissionRate { get; set; } = 10.0m; // Default percentage for this category
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<RentalItem> RentalItems { get; set; } = new List<RentalItem>();
}
