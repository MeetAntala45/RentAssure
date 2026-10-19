using RentAssure.Domain.Common;
using RentAssure.Domain.Enums;

namespace RentAssure.Domain.Entities;

public class Dispute : BaseEntity
{
    public string DisputeTicketNumber { get; set; } = string.Empty;

    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    public int RaisedByUserId { get; set; }
    public User RaisedByUser { get; set; } = null!;

    public DisputeReason Reason { get; set; }
    public DisputeStatus Status { get; set; } = DisputeStatus.Open;

    public decimal ClaimAmount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? EvidencePhotosJson { get; set; } = "[]";

    public string? VendorStatement { get; set; }
    public string? CustomerStatement { get; set; }
    public string? AdminDecisionNotes { get; set; }

    public int? ResolvedByUserId { get; set; }
    public User? ResolvedByUser { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public decimal RefundToCustomerAmount { get; set; } = 0.0m;
    public decimal PayoutToVendorAmount { get; set; } = 0.0m;
}
