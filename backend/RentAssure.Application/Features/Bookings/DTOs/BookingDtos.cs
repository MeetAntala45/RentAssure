using RentAssure.Domain.Enums;

namespace RentAssure.Application.Features.Bookings.DTOs;

public class CreateBookingRequestDto
{
    public int ItemId { get; set; }
    public int RentalDurationMonths { get; set; } = 3;
    public DateTime? StartDate { get; set; }
    public string DeliveryAddress { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
}

public class BookingDetailDto
{
    public int Id { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public int VendorId { get; set; }
    public string VendorStoreName { get; set; } = string.Empty;
    public string VendorCity { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemTitle { get; set; } = string.Empty;
    public string ItemImageUrl { get; set; } = string.Empty;
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
    public decimal? DepositRefundedAmount { get; set; }
    public decimal? DepositDeductedAmount { get; set; }
    public string DeliveryAddress { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public string? VendorNotes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RequestReturnDto
{
    public string? Reason { get; set; }
    public DateTime PreferredPickupDate { get; set; } = DateTime.UtcNow.AddDays(2);
}

public class RaiseCustomerDisputeDto
{
    public DisputeReason Reason { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal ClaimedAmount { get; set; }
}
