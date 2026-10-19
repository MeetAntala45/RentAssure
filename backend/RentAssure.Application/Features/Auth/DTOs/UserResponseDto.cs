namespace RentAssure.Application.Features.Auth.DTOs;

public class UserResponseDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer";
    public string? Token { get; set; }
    public string VendorStatus { get; set; } = "None";
    public int? VendorId { get; set; }
}
