namespace RentAssure.Application.Features.Auth.DTOs;

public class GoogleLoginRequestDto
{
    public string IdToken { get; set; } = string.Empty;
    public string? Role { get; set; }
}
