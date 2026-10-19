namespace RentAssure.Application.Features.Auth.DTOs;

/// <summary>
/// Internal DTO used between AuthService and Controller.
/// The controller reads AccessToken/RefreshToken to set cookies, then nulls them.
/// </summary>
public class AuthResponseDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer";
    public string VendorStatus { get; set; } = "None";
    public int? VendorId { get; set; }

    // These are consumed by the controller to set cookies, then nulled before returning
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime AccessTokenExpiry { get; set; }
    public DateTime RefreshTokenExpiry { get; set; }
}
