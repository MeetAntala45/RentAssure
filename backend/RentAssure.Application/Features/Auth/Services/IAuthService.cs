using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Auth.DTOs;

namespace RentAssure.Application.Features.Auth.Services;

public interface IAuthService
{
    Task<ApiResponse<UserResponseDto>> RegisterAsync(RegisterRequestDto request);
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request);
    Task<ApiResponse<AuthResponseDto>> GoogleLoginAsync(string idToken, string? role = null);
    Task<ApiResponse<AuthResponseDto>> RefreshAsync(string refreshToken);
    Task<ApiResponse<object>> LogoutAsync(string? refreshToken);
    Task<ApiResponse<UserResponseDto>> GetSessionAsync(int userId, string email, string fullName, string role);
}
