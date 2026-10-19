using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RentAssure.Application.Common.Interfaces;
using RentAssure.Application.Features.Admin.Services;
using RentAssure.Application.Features.Auth.Services;
using RentAssure.Application.Features.Bookings.Services;
using RentAssure.Application.Features.Items.Services;
using RentAssure.Application.Features.Vendors.Services;
using RentAssure.Infrastructure.Persistence;
using RentAssure.Infrastructure.Services;

namespace RentAssure.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Database
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                   .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        // Services
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IItemService, ItemService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IVendorService, VendorService>();

        return services;
    }
}
