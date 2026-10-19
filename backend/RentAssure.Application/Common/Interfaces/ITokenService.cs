using RentAssure.Domain.Entities;

namespace RentAssure.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
