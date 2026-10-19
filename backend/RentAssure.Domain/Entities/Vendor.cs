using RentAssure.Domain.Common;
using RentAssure.Domain.Enums;

namespace RentAssure.Domain.Entities;

public class Vendor : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string StoreName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string BusinessRegistrationNumber { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;

    // Location
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Onboarding & Approval Lifecycle
    public VendorStatus Status { get; set; } = VendorStatus.PendingApproval;
    public string? RejectionReason { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime? ApprovedAt { get; set; }

    // Commission & Payments
    public decimal? CommissionRateOverride { get; set; } // Nullable: defaults to global or category rate
    public string? StripeAccountId { get; set; }
    public bool IsStripePayoutEnabled { get; set; } = false;
    public decimal TotalEarnings { get; set; } = 0.0m;
    public decimal TotalCommissionPaid { get; set; } = 0.0m;

    // Navigation
    public ICollection<RentalItem> RentalItems { get; set; } = new List<RentalItem>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
