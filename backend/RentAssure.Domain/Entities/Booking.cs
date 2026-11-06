using RentAssure.Domain.Common;
using RentAssure.Domain.Enums;

namespace RentAssure.Domain.Entities;

public class Booking : BaseEntity
{
    public string BookingReference { get; set; } = string.Empty;

    public int CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    public int VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;

    public int ItemId { get; set; }
    public RentalItem Item { get; set; } = null!;
    public int Quantity { get; set; } = 1;

    // Rental Period
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int RentalDurationMonths { get; set; }

    // Pricing & Financial Breakdown
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public decimal TotalAmountPaid { get; set; } // Deposit + 1st month (or accumulated)
    public decimal CommissionRateApplied { get; set; }
    public decimal PlatformCommissionAmount { get; set; }
    public decimal VendorPayoutAmount { get; set; }

    // State Tracking
    public BookingStatus Status { get; set; } = BookingStatus.Reserved;
    public DepositStatus DepositStatus { get; set; } = DepositStatus.Held;
    public decimal? DepositRefundedAmount { get; set; }
    public decimal? DepositDeductedAmount { get; set; }

    // Delivery & OTP Verification (Lease begins on verified delivery)
    public string? DeliveryOtp { get; set; }
    public bool IsDeliveryVerified { get; set; } = false;
    public DateTime? DeliveredAt { get; set; }

    // Recurring Monthly Rent Cycles
    public int MonthsPaidCount { get; set; } = 1; // Month 1 paid at initial reservation
    public DateTime? NextPaymentDueDate { get; set; }
    public DateTime? LastPaymentDate { get; set; }

    // Logistics & Details
    public string DeliveryAddress { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public string? VendorNotes { get; set; }
    public string? StripeSubscriptionId { get; set; }

    // Stripe Payment Tracking
    public string? StripePaymentIntentId { get; set; }
    public string? StripeRefundId { get; set; }
    public bool IsPaidOnline { get; set; } = false;

    // Navigation
    public ICollection<Dispute> Disputes { get; set; } = new List<Dispute>();
}
