using RentAssure.Domain.Enums;
using RentAssure.Application.Common.Models;

namespace RentAssure.Application.Features.Admin.DTOs;

public class AdminDashboardStatsDto
{
    public decimal TotalGrossVolume { get; set; }
    public decimal PlatformCommissionEarned { get; set; }
    public decimal EscrowBalanceHeld { get; set; }
    public decimal VendorPayoutsCompleted { get; set; }
    public int ActiveRentalsCount { get; set; }
    public int TotalVendorsCount { get; set; }
    public int PendingApprovalsCount { get; set; }
    public int ApprovedVendorsCount { get; set; }
    public int TotalCustomersCount { get; set; }
    public int OpenDisputesCount { get; set; }

    public List<MonthlyTrendDto> MonthlyTrends { get; set; } = new();
    public List<CategoryShareDto> CategoryDistribution { get; set; } = new();
    public List<CityBookingStatDto> TopCities { get; set; } = new();
    public List<TopPartnerStatDto> TopPartners { get; set; } = new();
    public List<VendorSummaryDto> UrgentVendorApprovals { get; set; } = new();
    public List<DisputeSummaryDto> ActiveDisputesQueue { get; set; } = new();
    public List<BookingSummaryDto> RecentBookings { get; set; } = new();
    public List<AuditLogDto> RecentActivities { get; set; } = new();
}

public class MonthlyTrendDto
{
    public string Month { get; set; } = string.Empty;
    public decimal GrossRent { get; set; }
    public decimal Commission { get; set; }
    public decimal NetProfit { get; set; }
    public int BookingCount { get; set; }
}

public class CategoryShareDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int ItemCount { get; set; }
    public int ActiveBookingsCount { get; set; }
    public decimal TotalVolume { get; set; }
}

public class CityBookingStatDto
{
    public string City { get; set; } = string.Empty;
    public int BookingCount { get; set; }
    public decimal TotalVolume { get; set; }
}

public class TopPartnerStatDto
{
    public int VendorId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int CompletedBookings { get; set; }
    public decimal TotalEarnings { get; set; }
}

public class VendorSummaryDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string BusinessRegistrationNumber { get; set; } = string.Empty;
    public VendorStatus Status { get; set; }
    public decimal? CommissionRateOverride { get; set; }
    public decimal TotalEarnings { get; set; }
    public decimal TotalCommissionPaid { get; set; }
    public int TotalItemsCount { get; set; }
    public int ActiveBookingsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? AdminNotes { get; set; }
}

public class VendorDetailDto : VendorSummaryDto
{
    public string Address { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string? StripeAccountId { get; set; }
    public bool IsStripePayoutEnabled { get; set; }
    public List<ItemSummaryDto> Items { get; set; } = new();
    public List<BookingSummaryDto> RecentBookings { get; set; } = new();
}

public class ItemSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public int MinimumRentalMonths { get; set; }
    public ItemStatus Status { get; set; }
    public string City { get; set; } = string.Empty;
    public int TotalRentalsCount { get; set; }
    public string ImagesJson { get; set; } = "[]";
}

public class BookingSummaryDto
{
    public int Id { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public int VendorId { get; set; }
    public string VendorStoreName { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemTitle { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int RentalDurationMonths { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public decimal TotalAmountPaid { get; set; }
    public decimal CommissionRateApplied { get; set; }
    public decimal PlatformCommissionAmount { get; set; }
    public decimal VendorPayoutAmount { get; set; }
    public BookingStatus Status { get; set; }
    public DepositStatus DepositStatus { get; set; }
    public string DeliveryCity { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class DisputeSummaryDto
{
    public int Id { get; set; }
    public string DisputeTicketNumber { get; set; } = string.Empty;
    public int BookingId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string ItemTitle { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string VendorStoreName { get; set; } = string.Empty;
    public DisputeReason Reason { get; set; }
    public DisputeStatus Status { get; set; }
    public decimal ClaimAmount { get; set; }
    public decimal DepositHeld { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class DisputeDetailDto : DisputeSummaryDto
{
    public string? EvidencePhotosJson { get; set; }
    public string? CustomerStatement { get; set; }
    public string? VendorStatement { get; set; }
    public string? AdminDecisionNotes { get; set; }
    public decimal RefundToCustomerAmount { get; set; }
    public decimal PayoutToVendorAmount { get; set; }
    public string? ResolvedByUserName { get; set; }
    public BookingSummaryDto Booking { get; set; } = null!;
}

public class ResolveDisputeRequestDto
{
    public DisputeStatus Decision { get; set; } // ResolvedCustomerFavored, ResolvedVendorFavored, SplitResolution
    public decimal RefundToCustomerAmount { get; set; }
    public decimal PayoutToVendorAmount { get; set; }
    public string AdminNotes { get; set; } = string.Empty;
}

public class VendorApprovalRequestDto
{
    public string? AdminNotes { get; set; }
}

public class VendorRejectionRequestDto
{
    public string Reason { get; set; } = string.Empty;
}

public class VendorSuspensionRequestDto
{
    public string Reason { get; set; } = string.Empty;
}

public class VendorCommissionUpdateRequestDto
{
    public decimal? CommissionRate { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public decimal CommissionRate { get; set; }
    public bool IsActive { get; set; }
    public int ItemCount { get; set; }
}

public class CreateOrUpdateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public decimal CommissionRate { get; set; } = 10.0m;
    public bool IsActive { get; set; } = true;
}

public class PlatformSettingDto
{
    public int Id { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public class UpdatePlatformSettingDto
{
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
}

public class AuditLogDto
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string PerformedByUserName { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info";
    public DateTime CreatedAt { get; set; }
}

