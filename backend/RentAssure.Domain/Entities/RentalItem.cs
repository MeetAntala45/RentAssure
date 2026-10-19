using RentAssure.Domain.Common;
using RentAssure.Domain.Enums;

namespace RentAssure.Domain.Entities;

public class RentalItem : BaseEntity
{
    public int VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string Condition { get; set; } = "Brand New"; // Brand New, Like New, Good

    // Financials & Plans
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public int MinimumRentalMonths { get; set; } = 3;

    // Assets & Metadata
    public string ImagesJson { get; set; } = "[]"; // JSON array of image URLs
    public ItemStatus Status { get; set; } = ItemStatus.Available;

    // Location
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;

    public int TotalRentalsCount { get; set; } = 0;

    // Navigation
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
