namespace RentAssure.API.Extensions;

public static class CookieExtensions
{
    private const string AccessTokenCookieName = "accessToken";
    private const string RefreshTokenCookieName = "refreshToken";

    public static void AppendAuthCookies(
        this HttpResponse response,
        string accessToken,
        string refreshToken,
        DateTime accessTokenExpiry,
        DateTime refreshTokenExpiry)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/"
        };

        response.Cookies.Append(AccessTokenCookieName, accessToken, new CookieOptions
        {
            HttpOnly = cookieOptions.HttpOnly,
            Secure = cookieOptions.Secure,
            SameSite = cookieOptions.SameSite,
            Path = cookieOptions.Path,
            Expires = accessTokenExpiry
        });

        response.Cookies.Append(RefreshTokenCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = cookieOptions.HttpOnly,
            Secure = cookieOptions.Secure,
            SameSite = cookieOptions.SameSite,
            Path = cookieOptions.Path,
            Expires = refreshTokenExpiry
        });
    }

    public static void DeleteAuthCookies(this HttpResponse response)
    {
        var deleteOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/" // Must match the path used at creation
        };

        response.Cookies.Delete(AccessTokenCookieName, deleteOptions);
        response.Cookies.Delete(RefreshTokenCookieName, deleteOptions);
    }
}
