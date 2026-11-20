using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RentAssure.Domain.Entities;
using RentAssure.Domain.Enums;

namespace RentAssure.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger)
    {
        try
        {
            // Ensure SupportTickets table exists
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE IF NOT EXISTS ""SupportTickets"" (
                        ""Id"" serial PRIMARY KEY,
                        ""Name"" varchar(200) NOT NULL,
                        ""Email"" varchar(200) NOT NULL,
                        ""PhoneNumber"" varchar(50) NOT NULL,
                        ""Description"" varchar(2000) NOT NULL,
                        ""Status"" varchar(50) NOT NULL DEFAULT 'Open',
                        ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );
                ");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to ensure SupportTickets table exists.");
            }

            // 1. Ensure Default Admin User exists
            var adminEmail = "admin@rentassure.com";
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
            if (adminUser == null)
            {
                adminUser = new User
                {
                    FullName = "Platform Administrator",
                    Email = adminEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = UserRole.Admin,
                    IsActive = true,
                    PhoneNumber = "+1 (555) 019-2834"
                };
                context.Users.Add(adminUser);
                await context.SaveChangesAsync();
                logger.LogInformation("Ensured default Admin user: {Email}", adminEmail);
            }
            else
            {
                if (adminUser.Role != UserRole.Admin)
                {
                    adminUser.Role = UserRole.Admin;
                    await context.SaveChangesAsync();
                }
            }

            // 2. Ensure Platform Settings exist
            if (!await context.PlatformSettings.AnyAsync())
            {
                var settings = new List<PlatformSetting>
                {
                    new() { SettingKey = "Commission.DefaultFlatRate", SettingValue = "12.5", Group = "Financial", Description = "Default platform commission percentage on monthly rental subscription transactions." },
                    new() { SettingKey = "Escrow.HoldDurationDays", SettingValue = "7", Group = "Financial", Description = "Days security deposit is held in escrow following rental termination before automated release." },
                    new() { SettingKey = "Inspection.WindowHours", SettingValue = "48", Group = "Operations", Description = "Inspection time window granted to vendors upon item return to report condition or damages." },
                    new() { SettingKey = "Payout.Schedule", SettingValue = "Weekly", Group = "Financial", Description = "Stripe Connect automated vendor payout frequency." },
                    new() { SettingKey = "Platform.SupportEmail", SettingValue = "support@rentassure.com", Group = "General", Description = "Platform customer support and escalation contact email." }
                };
                context.PlatformSettings.AddRange(settings);
                await context.SaveChangesAsync();
            }

            // 3. Ensure Categories exist
            if (!await context.Categories.AnyAsync())
            {
                var categories = new List<Category>
                {
                    new() { Name = "Living & Bedroom Furniture", Slug = "furniture", Description = "Sofas, beds, dining sets, ergonomic study & office furniture", Icon = "bi-house-heart", CommissionRate = 12.0m, IsActive = true },
                    new() { Name = "Home & Kitchen Appliances", Slug = "appliances", Description = "Refrigerators, washing machines, microwaves, air conditioners", Icon = "bi-plug", CommissionRate = 10.0m, IsActive = true },
                    new() { Name = "Electronics & Pro AV", Slug = "electronics", Description = "4K TVs, audio systems, gaming setups, stage sound & cameras", Icon = "bi-display", CommissionRate = 15.0m, IsActive = true },
                    new() { Name = "Fitness & Event Rentals", Slug = "fitness-events", Description = "Treadmills, spin bikes, party equipment, projectors", Icon = "bi-bicycle", CommissionRate = 10.0m, IsActive = true }
                };
                context.Categories.AddRange(categories);
                await context.SaveChangesAsync();
            }

            // 4. Sanitize resolved dispute amounts to ensure escrow balance integrity
            var overDisbursedDisputes = await context.Disputes
                .Include(d => d.Booking)
                .Where(d => (d.Status == DisputeStatus.ResolvedCustomerFavored ||
                             d.Status == DisputeStatus.ResolvedVendorFavored ||
                             d.Status == DisputeStatus.SplitResolution ||
                             d.Status == DisputeStatus.Closed) &&
                            d.Booking != null &&
                            (d.RefundToCustomerAmount + d.PayoutToVendorAmount) > d.Booking.SecurityDeposit)
                .ToListAsync();

            foreach (var d in overDisbursedDisputes)
            {
                var deposit = d.Booking.SecurityDeposit;
                if (d.Status == DisputeStatus.ResolvedCustomerFavored || d.Status == DisputeStatus.Closed)
                {
                    d.RefundToCustomerAmount = deposit;
                    d.PayoutToVendorAmount = 0m;
                    d.Booking.DepositRefundedAmount = deposit;
                    d.Booking.DepositDeductedAmount = 0m;
                    d.Booking.DepositStatus = DepositStatus.Refunded;
                }
                else if (d.Status == DisputeStatus.ResolvedVendorFavored)
                {
                    d.RefundToCustomerAmount = 0m;
                    d.PayoutToVendorAmount = deposit;
                    d.Booking.DepositRefundedAmount = 0m;
                    d.Booking.DepositDeductedAmount = deposit;
                    d.Booking.DepositStatus = DepositStatus.Deducted;
                }
                else if (d.Status == DisputeStatus.SplitResolution)
                {
                    var sum = d.RefundToCustomerAmount + d.PayoutToVendorAmount;
                    if (sum > 0)
                    {
                        d.RefundToCustomerAmount = Math.Round((d.RefundToCustomerAmount / sum) * deposit, 2);
                        d.PayoutToVendorAmount = deposit - d.RefundToCustomerAmount;
                    }
                    d.Booking.DepositRefundedAmount = d.RefundToCustomerAmount;
                    d.Booking.DepositDeductedAmount = d.PayoutToVendorAmount;
                    d.Booking.DepositStatus = DepositStatus.PartiallyRefunded;
                }
                d.Booking.Status = BookingStatus.Completed;
            }

            // Also ensure any booking whose dispute is resolved is set to Completed
            var resolvedDisputeBookings = await context.Bookings
                .Include(b => b.Disputes)
                .Where(b => b.Status != BookingStatus.Completed &&
                            b.Disputes.Any(d => d.Status == DisputeStatus.ResolvedCustomerFavored ||
                                                d.Status == DisputeStatus.ResolvedVendorFavored ||
                                                d.Status == DisputeStatus.SplitResolution ||
                                                d.Status == DisputeStatus.Closed))
                .ToListAsync();

            foreach (var b in resolvedDisputeBookings)
            {
                b.Status = BookingStatus.Completed;
            }

            if (overDisbursedDisputes.Any() || resolvedDisputeBookings.Any())
            {
                await context.SaveChangesAsync();
                logger.LogInformation("Sanitized disputes and updated {Count} bookings to Completed.", resolvedDisputeBookings.Count);
            }

            // 5. Seed sample reviews if none exist
            if (!await context.RentalReviews.AnyAsync())
            {
                var sampleBookings = await context.Bookings
                    .Include(b => b.Item)
                    .Include(b => b.Customer)
                    .Take(3)
                    .ToListAsync();

                var sampleReviews = new List<RentalReview>();
                int rIdx = 0;
                string[] sampleComments = {
                    "Outstanding condition! The product was delivered promptly and worked flawlessly throughout our rental tenure.",
                    "Super clean and well maintained. Customer support was very helpful during handover and return.",
                    "Great rental experience! Smooth return process and deposit was refunded without any hassle."
                };

                foreach (var b in sampleBookings)
                {
                    sampleReviews.Add(new RentalReview
                    {
                        BookingId = b.Id,
                        ItemId = b.ItemId,
                        CustomerId = b.CustomerId,
                        Rating = rIdx == 1 ? 4 : 5,
                        Comment = sampleComments[rIdx % sampleComments.Length],
                        CreatedAt = DateTime.UtcNow.AddDays(-4 - (rIdx * 2)),
                        UpdatedAt = DateTime.UtcNow.AddDays(-4 - (rIdx * 2))
                    });
                    rIdx++;
                }

                if (sampleReviews.Any())
                {
                    context.RentalReviews.AddRange(sampleReviews);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Seeded {Count} sample verified reviews.", sampleReviews.Count);
                }
            }

            logger.LogInformation("Database startup check completed.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during database startup check.");
        }
    }
}
