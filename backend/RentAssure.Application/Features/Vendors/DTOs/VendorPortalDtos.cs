using RentAssure.Domain.Enums;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Application.Features.Bookings.DTOs;

namespace RentAssure.Application.Features.Vendors.DTOs;

public class VendorDashboardMetricsDto
{
    public int VendorId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public VendorStatus Status { get; set; }
    public decimal CommissionRate { get; set; }
    public int TotalListings { get; set; }
    public int ActiveRentalsCount { get; set; }
    public decimal MonthlyGrossRent { get; set; }
    public decimal MonthlyNetProfit { get; set; }
    public decimal TotalGrossRevenue { get; set; }
    public decimal TotalEarnings { get; set; }
    public decimal TotalCommissionPaid { get; set; }
    public decimal EscrowDepositsHeld { get; set; }
    public decimal ProfitMargin { get; set; }
    public int PendingDeliveriesCount { get; set; }
    public int PendingReturnsCount { get; set; }

    public List<CategoryShareDto> CategoryDistribution { get; set; } = new();
    public List<MonthlyTrendDto> MonthlyTrends { get; set; } = new();
    public List<CityBookingStatDto> TopCities { get; set; } = new();
    public List<BookingDetailDto> RecentBookings { get; set; } = new();
    public List<VendorProfitableItemDto> TopProfitableItems { get; set; } = new();
}

public class VendorProfitableItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public decimal MonthlyRent { get; set; }
    public int TotalRentals { get; set; }
    public decimal TotalGrossRevenue { get; set; }
    public decimal TotalNetProfit { get; set; }
    public ItemStatus Status { get; set; }
    public string? ImageUrl { get; set; }
}

public class VendorItemListingDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string Condition { get; set; } = "Brand New";
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public int MinimumRentalMonths { get; set; }
    public ItemStatus Status { get; set; }
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public int TotalRentalsCount { get; set; }
    public List<string> Images { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class UpdateVendorOrderStatusDto
{
    public BookingStatus Status { get; set; }
    public string? VendorNotes { get; set; }
}

public class VendorProfileUpdateDto
{
    public string StoreName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
}

public class VendorStatusDto
{
    public bool HasProfile { get; set; }
    public int? VendorId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string BusinessRegistrationNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "None"; // None, PendingApproval, Approved, Rejected, Suspended
    public string? RejectionReason { get; set; }
    public string? AdminNotes { get; set; }
    public string? PhoneNumber { get; set; }
    public string? SupportEmail { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public class VendorOnboardingRequestDto
{
    public string StoreName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string BusinessRegistrationNumber { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;

    // Rich metadata matching UI Screenshot 3
    public string? StoreCategory { get; set; }
    public string? ExperienceYears { get; set; }
    public string? ServicesOffered { get; set; }
    public string? LanguagesSpoken { get; set; }
    public string? PreviousExperience { get; set; }
    public string? DocumentsJson { get; set; }
}
