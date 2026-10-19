using RentAssure.Domain.Common;
using RentAssure.Domain.Enums;

namespace RentAssure.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public Vendor? VendorProfile { get; set; }
    public ICollection<Booking> CustomerBookings { get; set; } = new List<Booking>();
    public ICollection<Dispute> RaisedDisputes { get; set; } = new List<Dispute>();
}
