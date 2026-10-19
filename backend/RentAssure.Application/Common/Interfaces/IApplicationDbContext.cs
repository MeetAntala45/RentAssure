using Microsoft.EntityFrameworkCore;
using RentAssure.Domain.Entities;

namespace RentAssure.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Vendor> Vendors { get; }
    DbSet<Category> Categories { get; }
    DbSet<RentalItem> RentalItems { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<Dispute> Disputes { get; }
    DbSet<PlatformSetting> PlatformSettings { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<SupportTicket> SupportTickets { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
