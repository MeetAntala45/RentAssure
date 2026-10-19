using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RentAssure.Application.Common.Interfaces;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Auth.DTOs;
using RentAssure.Domain.Entities;
using RentAssure.Domain.Enums;

namespace RentAssure.Application.Features.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly ILogger<AuthService> _logger;

    private const int RefreshTokenExpiryDays = 7;
    private const int AccessTokenExpiryMinutes = 60 * 24 * 7; // 7 days for stable testing & production sessions

    public AuthService(
        IApplicationDbContext context,
        ITokenService tokenService,
        IGoogleAuthService googleAuthService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _googleAuthService = googleAuthService;
        _logger = logger;
    }

    public async Task<ApiResponse<UserResponseDto>> RegisterAsync(RegisterRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == normalizedEmail);

        if (emailExists)
        {
            return ApiResponse<UserResponseDto>.Fail(
                "An account with this email already exists.",
                nameof(AuthErrorCode.EmailAlreadyExists));
        }

        var role = UserRole.Customer;
        if (string.Equals(request.Role, "Vendor", StringComparison.OrdinalIgnoreCase))
        {
            role = UserRole.Vendor;
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User registered: {Email} (ID: {UserId}, Role: {Role})", user.Email, user.Id, user.Role);

        return ApiResponse<UserResponseDto>.Success(new UserResponseDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            VendorStatus = "None"
        }, "Registration successful. Please log in.");
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return ApiResponse<AuthResponseDto>.Fail(
                "Invalid email or password.",
                nameof(AuthErrorCode.InvalidCredentials));
        }

        if (!user.IsActive)
        {
            return ApiResponse<AuthResponseDto>.Fail(
                "Your account has been deactivated. Please contact support.",
                nameof(AuthErrorCode.AccountInactive));
        }

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<ApiResponse<AuthResponseDto>> GoogleLoginAsync(string idToken, string? role = null)
    {
        var googleUser = await _googleAuthService.ValidateGoogleTokenAsync(idToken);

        if (googleUser is null)
        {
            return ApiResponse<AuthResponseDto>.Fail(
                "Invalid Google token.",
                nameof(AuthErrorCode.InvalidGoogleToken));
        }

        var normalizedEmail = googleUser.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        var requestedRole = string.Equals(role, "Vendor", StringComparison.OrdinalIgnoreCase)
            ? UserRole.Vendor
            : UserRole.Customer;

        if (user is null)
        {
            // Create new user with proper requested role
            user = new User
            {
                FullName = googleUser.FullName,
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                Role = requestedRole,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Google user created: {Email} (ID: {UserId}, Role: {Role})", user.Email, user.Id, user.Role);
        }
        else if (requestedRole == UserRole.Vendor && user.Role == UserRole.Customer)
        {
            // Upgrade existing customer to vendor when signing in via vendor portal
            user.Role = UserRole.Vendor;
            await _context.SaveChangesAsync();
        }

        if (!user.IsActive)
        {
            return ApiResponse<AuthResponseDto>.Fail(
                "Your account has been deactivated. Please contact support.",
                nameof(AuthErrorCode.AccountInactive));
        }

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<ApiResponse<AuthResponseDto>> RefreshAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken is null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return ApiResponse<AuthResponseDto>.Fail(
                "Invalid or expired refresh token.",
                nameof(AuthErrorCode.InvalidRefreshToken));
        }

        if (!storedToken.User.IsActive)
        {
            return ApiResponse<AuthResponseDto>.Fail(
                "Your account has been deactivated.",
                nameof(AuthErrorCode.AccountInactive));
        }

        // Rotate: revoke old token
        storedToken.IsRevoked = true;
        storedToken.UpdatedAt = DateTime.UtcNow;

        // Generate new tokens
        var newRefreshTokenValue = _tokenService.GenerateRefreshToken();
        var newRefreshToken = new RefreshToken
        {
            Token = newRefreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays),
            IsRevoked = false,
            UserId = storedToken.UserId
        };

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync();

        var accessToken = _tokenService.GenerateAccessToken(storedToken.User);
        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.UserId == storedToken.UserId);

        return ApiResponse<AuthResponseDto>.Success(new AuthResponseDto
        {
            UserId = storedToken.User.Id,
            FullName = storedToken.User.FullName,
            Email = storedToken.User.Email,
            Role = storedToken.User.Role.ToString(),
            VendorStatus = vendor?.Status.ToString() ?? "None",
            VendorId = vendor?.Id,
            AccessToken = accessToken,
            RefreshToken = newRefreshTokenValue,
            AccessTokenExpiry = DateTime.UtcNow.AddMinutes(AccessTokenExpiryMinutes),
            RefreshTokenExpiry = newRefreshToken.ExpiresAt
        });
    }

    public async Task<ApiResponse<object>> LogoutAsync(string? refreshToken)
    {
        if (!string.IsNullOrEmpty(refreshToken))
        {
            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (storedToken is not null && !storedToken.IsRevoked)
            {
                storedToken.IsRevoked = true;
                storedToken.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        return ApiResponse<object>.Success(null!, "Logged out successfully.");
    }

    public async Task<ApiResponse<UserResponseDto>> GetSessionAsync(int userId, string email, string fullName, string role)
    {
        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.UserId == userId);
        return ApiResponse<UserResponseDto>.Success(new UserResponseDto
        {
            UserId = userId,
            FullName = fullName,
            Email = email,
            Role = role,
            VendorStatus = vendor?.Status.ToString() ?? "None",
            VendorId = vendor?.Id
        });
    }

    /// <summary>
    /// Shared logic for login and Google login: revoke all existing refresh tokens,
    /// generate new token pair, return AuthResponseDto with tokens for cookie setting.
    /// </summary>
    private async Task<ApiResponse<AuthResponseDto>> GenerateAuthResponseAsync(User user)
    {
        // Revoke all existing non-revoked refresh tokens (single-session-per-user)
        var existingTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
            .ToListAsync();

        foreach (var token in existingTokens)
        {
            token.IsRevoked = true;
            token.UpdatedAt = DateTime.UtcNow;
        }

        // Generate new tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshTokenValue = _tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays),
            IsRevoked = false,
            UserId = user.Id
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User logged in: {Email} (ID: {UserId})", user.Email, user.Id);

        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.UserId == user.Id);

        return ApiResponse<AuthResponseDto>.Success(new AuthResponseDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            VendorStatus = vendor?.Status.ToString() ?? "None",
            VendorId = vendor?.Id,
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            AccessTokenExpiry = DateTime.UtcNow.AddMinutes(AccessTokenExpiryMinutes),
            RefreshTokenExpiry = refreshToken.ExpiresAt
        });
    }
}
