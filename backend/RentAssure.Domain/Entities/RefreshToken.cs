using RentAssure.Domain.Common;

namespace RentAssure.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }

    // Foreign key
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
