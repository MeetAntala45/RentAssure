namespace RentAssure.Domain.Enums;

public enum AuthErrorCode
{
    InvalidCredentials,
    EmailAlreadyExists,
    InvalidRefreshToken,
    AccountInactive,
    InvalidGoogleToken,
    ValidationFailed
}
