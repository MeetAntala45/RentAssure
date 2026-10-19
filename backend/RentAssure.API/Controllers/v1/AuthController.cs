using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.API.Extensions;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Auth.DTOs;
using RentAssure.Application.Features.Auth.Services;
using RentAssure.Domain.Enums;

namespace RentAssure.API.Controllers.v1;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Register a new user. No cookies are issued — client redirects to /login.
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> Register(
        [FromBody] RegisterRequestDto request)
    {
        var result = await _authService.RegisterAsync(request);

        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Login with email/password. Sets access + refresh cookies. Enforces RequiredRole if specified.
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> Login(
        [FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (!result.IsSuccess)
        {
            if (string.Equals(result.ErrorCode, "RoleUnauthorized", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<UserResponseDto>.Fail(
                    result.Message!,
                    result.ErrorCode));
            }
            return Unauthorized(result);
        }

        // Set cookies
        Response.AppendAuthCookies(
            result.Data!.AccessToken!,
            result.Data.RefreshToken!,
            result.Data.AccessTokenExpiry,
            result.Data.RefreshTokenExpiry);

        return Ok(ToUserResponse(result));
    }

    /// <summary>
    /// Customer-only login. Rejects Admin and Vendor credentials.
    /// </summary>
    [HttpPost("customer/login")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> CustomerLogin(
        [FromBody] LoginRequestDto request)
    {
        request.RequiredRole = "Customer";
        return await Login(request);
    }

    /// <summary>
    /// Vendor-only login. Rejects Customer and Admin credentials.
    /// </summary>
    [HttpPost("vendor/login")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> VendorLogin(
        [FromBody] LoginRequestDto request)
    {
        request.RequiredRole = "Vendor";
        return await Login(request);
    }

    /// <summary>
    /// Admin-only login. Rejects customer and vendor credentials.
    /// </summary>
    [HttpPost("admin/login")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> AdminLogin(
        [FromBody] LoginRequestDto request)
    {
        request.RequiredRole = "Admin";
        return await Login(request);
    }

    /// <summary>
    /// Login with Google ID token. Sets access + refresh cookies.
    /// </summary>
    [HttpPost("google")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> GoogleLogin(
        [FromBody] GoogleLoginRequestDto request)
    {
        var result = await _authService.GoogleLoginAsync(request.IdToken, request.Role);

        if (!result.IsSuccess)
            return Unauthorized(ApiResponse<UserResponseDto>.Fail(
                result.Message!, result.ErrorCode));

        // Set cookies and strip tokens from body
        Response.AppendAuthCookies(
            result.Data!.AccessToken!,
            result.Data.RefreshToken!,
            result.Data.AccessTokenExpiry,
            result.Data.RefreshTokenExpiry);

        return Ok(ToUserResponse(result));
    }

    /// <summary>
    /// Refresh token rotation. Reads refresh token from cookie.
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
        {
            Response.DeleteAuthCookies();
            return Unauthorized(ApiResponse<UserResponseDto>.Fail(
                "No refresh token provided.",
                nameof(AuthErrorCode.InvalidRefreshToken)));
        }

        var result = await _authService.RefreshAsync(refreshToken);

        if (!result.IsSuccess)
        {
            Response.DeleteAuthCookies();
            return Unauthorized(ApiResponse<UserResponseDto>.Fail(
                result.Message!, result.ErrorCode));
        }

        // Set new cookies
        Response.AppendAuthCookies(
            result.Data!.AccessToken!,
            result.Data.RefreshToken!,
            result.Data.AccessTokenExpiry,
            result.Data.RefreshTokenExpiry);

        return Ok(ToUserResponse(result));
    }

    /// <summary>
    /// Get current session from JWT claims. No DB query.
    /// </summary>
    [Authorize]
    [HttpGet("session")]
    public async Task<ActionResult<ApiResponse<UserResponseDto>>> Session()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idStr, out var userId))
        {
            return Unauthorized(ApiResponse<UserResponseDto>.Fail("Invalid token session.", "InvalidToken"));
        }
        var email = User.FindFirstValue(ClaimTypes.Email) ?? "";
        var fullName = User.FindFirstValue("fullName") ?? User.FindFirstValue(ClaimTypes.Name) ?? "User";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "Customer";

        var result = await _authService.GetSessionAsync(userId, email, fullName, role);
        return Ok(result);
    }

    /// <summary>
    /// Logout: revoke refresh token and delete cookies.
    /// </summary>
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<object>>> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        await _authService.LogoutAsync(refreshToken);

        Response.DeleteAuthCookies();

        return Ok(ApiResponse<object>.Success(null!, "Logged out successfully."));
    }

    /// <summary>
    /// Maps AuthResponseDto to UserResponseDto with token and vendor status.
    /// </summary>
    private static ApiResponse<UserResponseDto> ToUserResponse(ApiResponse<AuthResponseDto> authResult)
    {
        return ApiResponse<UserResponseDto>.Success(new UserResponseDto
        {
            UserId = authResult.Data!.UserId,
            FullName = authResult.Data.FullName,
            Email = authResult.Data.Email,
            Role = authResult.Data.Role,
            Token = authResult.Data.AccessToken,
            VendorStatus = authResult.Data.VendorStatus,
            VendorId = authResult.Data.VendorId
        }, authResult.Message);
    }
}
