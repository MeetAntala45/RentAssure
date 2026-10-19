namespace RentAssure.Application.Common.Interfaces;

public interface IGoogleAuthService
{
    Task<GoogleUserInfo?> ValidateGoogleTokenAsync(string idToken);
}

public class GoogleUserInfo
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
}
