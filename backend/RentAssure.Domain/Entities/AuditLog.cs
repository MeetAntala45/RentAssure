using RentAssure.Domain.Common;

namespace RentAssure.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string Action { get; set; } = string.Empty; // e.g. "VendorApproved", "DisputeResolved", "CommissionUpdated"
    public string EntityType { get; set; } = string.Empty; // "Vendor", "Dispute", "PlatformSetting"
    public string EntityId { get; set; } = string.Empty;
    public int? PerformedByUserId { get; set; }
    public string PerformedByUserName { get; set; } = "System Admin";
    public string Details { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info"; // Info, Warning, Critical
}
