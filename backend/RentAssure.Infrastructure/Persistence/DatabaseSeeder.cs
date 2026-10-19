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
            // 1. Seed Admin User
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
                logger.LogInformation("Seeded default Admin user: {Email}", adminEmail);
            }
            else
            {
                // Ensure admin role
                if (adminUser.Role != UserRole.Admin)
                {
                    adminUser.Role = UserRole.Admin;
                    await context.SaveChangesAsync();
                }
            }

            // 2. Seed Platform Settings
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

            // 3. Seed Categories
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

            // 4. Seed Customers & Vendors
            if (!await context.Vendors.AnyAsync())
            {
                var customer1 = new User
                {
                    FullName = "Alex Morgan",
                    Email = "alex.morgan@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                    Role = UserRole.Customer,
                    PhoneNumber = "+1 (415) 890-1122",
                    IsActive = true
                };
                var customer2 = new User
                {
                    FullName = "Sarah Jenkins",
                    Email = "sarah.j@outlook.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                    Role = UserRole.Customer,
                    PhoneNumber = "+1 (415) 345-6789",
                    IsActive = true
                };
                var customer3 = new User
                {
                    FullName = "David Kim",
                    Email = "david.kim@techcorp.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                    Role = UserRole.Customer,
                    PhoneNumber = "+1 (415) 765-4321",
                    IsActive = true
                };

                // Vendor 1 User
                var vendorUser1 = new User
                {
                    FullName = "Marcus Vance",
                    Email = "marcus@urbanliving.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Vendor@123"),
                    Role = UserRole.Vendor,
                    PhoneNumber = "+1 (415) 555-0101",
                    IsActive = true
                };
                // Vendor 2 User
                var vendorUser2 = new User
                {
                    FullName = "Priya Sharma",
                    Email = "priya@apexdepot.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Vendor@123"),
                    Role = UserRole.Vendor,
                    PhoneNumber = "+1 (415) 555-0202",
                    IsActive = true
                };
                // Vendor 3 User (Pending)
                var vendorUser3 = new User
                {
                    FullName = "Liam Gallagher",
                    Email = "liam@soundwave-gear.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Vendor@123"),
                    Role = UserRole.Vendor,
                    PhoneNumber = "+1 (408) 555-0303",
                    IsActive = true
                };
                // Vendor 4 User (Pending)
                var vendorUser4 = new User
                {
                    FullName = "Elena Gomez",
                    Email = "elena@nextgenmobility.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Vendor@123"),
                    Role = UserRole.Vendor,
                    PhoneNumber = "+1 (510) 555-0404",
                    IsActive = true
                };
                // Vendor 5 User (Suspended)
                var vendorUser5 = new User
                {
                    FullName = "Tom Bradley",
                    Email = "tom@baycityretro.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Vendor@123"),
                    Role = UserRole.Vendor,
                    PhoneNumber = "+1 (415) 555-0505",
                    IsActive = true
                };

                context.Users.AddRange(customer1, customer2, customer3, vendorUser1, vendorUser2, vendorUser3, vendorUser4, vendorUser5);
                await context.SaveChangesAsync();

                // Create Vendor Profiles
                var vendor1 = new Vendor
                {
                    UserId = vendorUser1.Id,
                    StoreName = "Urban Living Furniture Co.",
                    OwnerName = "Marcus Vance",
                    BusinessRegistrationNumber = "CA-LLC-8921873",
                    PhoneNumber = "+1 (415) 555-0101",
                    SupportEmail = "support@urbanliving.com",
                    Address = "742 Mission Street, Suite 300",
                    City = "San Francisco",
                    State = "CA",
                    PostalCode = "94103",
                    Status = VendorStatus.Approved,
                    CommissionRateOverride = 12.0m,
                    TotalEarnings = 18450.00m,
                    TotalCommissionPaid = 2460.00m,
                    ApprovedAt = DateTime.UtcNow.AddMonths(-3),
                    StripeAccountId = "acct_1N00UrbanLiving",
                    IsStripePayoutEnabled = true
                };

                var vendor2 = new Vendor
                {
                    UserId = vendorUser2.Id,
                    StoreName = "Apex Appliance Depot",
                    OwnerName = "Priya Sharma",
                    BusinessRegistrationNumber = "CA-CORP-4401928",
                    PhoneNumber = "+1 (415) 555-0202",
                    SupportEmail = "service@apexdepot.com",
                    Address = "1290 Folsom Street",
                    City = "San Francisco",
                    State = "CA",
                    PostalCode = "94103",
                    Status = VendorStatus.Approved,
                    CommissionRateOverride = 10.0m,
                    TotalEarnings = 12800.00m,
                    TotalCommissionPaid = 1420.00m,
                    ApprovedAt = DateTime.UtcNow.AddMonths(-2),
                    StripeAccountId = "acct_1N00ApexDepot",
                    IsStripePayoutEnabled = true
                };

                var vendor3 = new Vendor
                {
                    UserId = vendorUser3.Id,
                    StoreName = "SoundWave Stage & Audio Rentals",
                    OwnerName = "Liam Gallagher",
                    BusinessRegistrationNumber = "CA-LLC-7718290",
                    PhoneNumber = "+1 (408) 555-0303",
                    SupportEmail = "bookings@soundwave-gear.com",
                    Address = "340 S 1st St",
                    City = "San Jose",
                    State = "CA",
                    PostalCode = "95113",
                    Status = VendorStatus.PendingApproval,
                    CommissionRateOverride = null,
                    AdminNotes = "Submitted business certificate, ID scan, and showroom photos. Awaiting catalog review.",
                    TotalEarnings = 0m,
                    TotalCommissionPaid = 0m
                };

                var vendor4 = new Vendor
                {
                    UserId = vendorUser4.Id,
                    StoreName = "NextGen Mobility & Gym Gear",
                    OwnerName = "Elena Gomez",
                    BusinessRegistrationNumber = "CA-DBA-9921043",
                    PhoneNumber = "+1 (510) 555-0404",
                    SupportEmail = "rentals@nextgenmobility.com",
                    Address = "1801 Telegraph Ave",
                    City = "Oakland",
                    State = "CA",
                    PostalCode = "94612",
                    Status = VendorStatus.PendingApproval,
                    CommissionRateOverride = null,
                    AdminNotes = "Specialized commercial fitness equipment. Certificate of insurance verified.",
                    TotalEarnings = 0m,
                    TotalCommissionPaid = 0m
                };

                var vendor5 = new Vendor
                {
                    UserId = vendorUser5.Id,
                    StoreName = "Bay City Retro Equipment",
                    OwnerName = "Tom Bradley",
                    BusinessRegistrationNumber = "CA-LLC-1029384",
                    PhoneNumber = "+1 (415) 555-0505",
                    SupportEmail = "tom@baycityretro.com",
                    Address = "500 Howard Street",
                    City = "San Francisco",
                    State = "CA",
                    PostalCode = "94105",
                    Status = VendorStatus.Suspended,
                    RejectionReason = "Repeated delivery cancellations and uninspected returned goods reported by renters.",
                    AdminNotes = "Account suspended on Sept 15, 2026 pending arbitration.",
                    TotalEarnings = 1200.00m,
                    TotalCommissionPaid = 150.00m
                };

                context.Vendors.AddRange(vendor1, vendor2, vendor3, vendor4, vendor5);
                await context.SaveChangesAsync();

                // 5. Seed Items
                var catFurniture = await context.Categories.FirstAsync(c => c.Slug == "furniture");
                var catAppliances = await context.Categories.FirstAsync(c => c.Slug == "appliances");
                var catElectronics = await context.Categories.FirstAsync(c => c.Slug == "electronics");
                var catFitness = await context.Categories.FirstAsync(c => c.Slug == "fitness-events");

                var item1 = new RentalItem
                {
                    VendorId = vendor1.Id,
                    CategoryId = catFurniture.Id,
                    Title = "Nordic Solid Oak Dining Table & 6 Chairs",
                    Description = "Minimalist Scandinavian solid white oak dining set, seats 6 comfortably. Stain-resistant lacquer finish.",
                    Brand = "Kastel Design",
                    Model = "Nord-220",
                    Condition = "Brand New",
                    MonthlyRent = 89.00m,
                    SecurityDeposit = 350.00m,
                    MinimumRentalMonths = 3,
                    City = "San Francisco",
                    Area = "SOMA",
                    Status = ItemStatus.Rented,
                    TotalRentalsCount = 4,
                    ImagesJson = "[\"https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80\"]"
                };

                var item2 = new RentalItem
                {
                    VendorId = vendor1.Id,
                    CategoryId = catFurniture.Id,
                    Title = "Modena Velvet Sectional Sofa with Reversible Chaise",
                    Description = "Deep-seated luxury modular sectional in emerald green velvet. High-resilience memory foam cushions.",
                    Brand = "Article",
                    Model = "Modena L-Shape",
                    Condition = "Like New",
                    MonthlyRent = 125.00m,
                    SecurityDeposit = 450.00m,
                    MinimumRentalMonths = 6,
                    City = "San Francisco",
                    Area = "Mission District",
                    Status = ItemStatus.Rented,
                    TotalRentalsCount = 6,
                    ImagesJson = "[\"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80\"]"
                };

                var item3 = new RentalItem
                {
                    VendorId = vendor2.Id,
                    CategoryId = catAppliances.Id,
                    Title = "LG Smart Inverter 450L French Door Refrigerator",
                    Description = "Energy-star rated stainless steel French door refrigerator with Door-in-Door and dual ice maker.",
                    Brand = "LG",
                    Model = "GF-L570PL",
                    Condition = "Brand New",
                    MonthlyRent = 95.00m,
                    SecurityDeposit = 400.00m,
                    MinimumRentalMonths = 3,
                    City = "San Francisco",
                    Area = "Potrero Hill",
                    Status = ItemStatus.Rented,
                    TotalRentalsCount = 5,
                    ImagesJson = "[\"https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80\"]"
                };

                var item4 = new RentalItem
                {
                    VendorId = vendor2.Id,
                    CategoryId = catAppliances.Id,
                    Title = "Samsung Front Load AI Washer & Dryer Combo 9.5kg",
                    Description = "Smart dial front load washer with steam wash, EcoBubble and silent inverter technology.",
                    Brand = "Samsung",
                    Model = "WD95T754DBT",
                    Condition = "Brand New",
                    MonthlyRent = 79.00m,
                    SecurityDeposit = 300.00m,
                    MinimumRentalMonths = 3,
                    City = "San Francisco",
                    Area = "South Beach",
                    Status = ItemStatus.Available,
                    TotalRentalsCount = 3,
                    ImagesJson = "[\"https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80\"]"
                };

                var item5 = new RentalItem
                {
                    VendorId = vendor1.Id,
                    CategoryId = catFurniture.Id,
                    Title = "Herman Miller Aeron Ergonomic Task Chair (Size B)",
                    Description = "Fully loaded ergonomic executive office chair with posturefit SL, adjustable lumbar and tilt lock.",
                    Brand = "Herman Miller",
                    Model = "Aeron B Remastered",
                    Condition = "Like New",
                    MonthlyRent = 65.00m,
                    SecurityDeposit = 250.00m,
                    MinimumRentalMonths = 3,
                    City = "San Francisco",
                    Area = "Financial District",
                    Status = ItemStatus.Rented,
                    TotalRentalsCount = 8,
                    ImagesJson = "[\"https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=800&auto=format&fit=crop&q=80\"]"
                };

                var item6 = new RentalItem
                {
                    VendorId = vendor3.Id,
                    CategoryId = catElectronics.Id,
                    Title = "Sony Cinema Line FX3 Camera + 24-70mm GM Lens Bundle",
                    Description = "Full-frame cinema recording kit, 4K 120p, XLR audio top handle, 2x 160GB CFexpress cards.",
                    Brand = "Sony",
                    Model = "FX3 + SEL2470GM2",
                    Condition = "Brand New",
                    MonthlyRent = 240.00m,
                    SecurityDeposit = 900.00m,
                    MinimumRentalMonths = 1,
                    City = "San Jose",
                    Area = "Downtown",
                    Status = ItemStatus.Available,
                    TotalRentalsCount = 1,
                    ImagesJson = "[\"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80\"]"
                };

                var item7 = new RentalItem
                {
                    VendorId = vendor4.Id,
                    CategoryId = catFitness.Id,
                    Title = "Peloton Bike+ with 24\" Rotating HD Screen",
                    Description = "Interactive connected cardio bike with auto-resistance, Apple GymKit, and 3lb weight set.",
                    Brand = "Peloton",
                    Model = "Bike+ Series",
                    Condition = "Brand New",
                    MonthlyRent = 110.00m,
                    SecurityDeposit = 400.00m,
                    MinimumRentalMonths = 3,
                    City = "Oakland",
                    Area = "Uptown",
                    Status = ItemStatus.Available,
                    TotalRentalsCount = 2,
                    ImagesJson = "[\"https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80\"]"
                };

                context.RentalItems.AddRange(item1, item2, item3, item4, item5, item6, item7);
                await context.SaveChangesAsync();

                // 6. Seed Bookings
                var booking1 = new Booking
                {
                    BookingReference = "RA-BK-2026-1001",
                    CustomerId = customer1.Id,
                    VendorId = vendor1.Id,
                    ItemId = item1.Id,
                    StartDate = DateTime.UtcNow.AddMonths(-3),
                    EndDate = DateTime.UtcNow.AddDays(2),
                    RentalDurationMonths = 3,
                    MonthlyRent = 89.00m,
                    SecurityDeposit = 350.00m,
                    TotalAmountPaid = 617.00m,
                    CommissionRateApplied = 12.0m,
                    PlatformCommissionAmount = 74.04m,
                    VendorPayoutAmount = 542.96m,
                    Status = BookingStatus.ReturnRequested,
                    DepositStatus = DepositStatus.Held,
                    DeliveryAddress = "450 Sutter St, Apt 8B",
                    DeliveryCity = "San Francisco"
                };

                var booking2 = new Booking
                {
                    BookingReference = "RA-BK-2026-1002",
                    CustomerId = customer2.Id,
                    VendorId = vendor1.Id,
                    ItemId = item2.Id,
                    StartDate = DateTime.UtcNow.AddMonths(-1),
                    EndDate = DateTime.UtcNow.AddMonths(5),
                    RentalDurationMonths = 6,
                    MonthlyRent = 125.00m,
                    SecurityDeposit = 450.00m,
                    TotalAmountPaid = 575.00m,
                    CommissionRateApplied = 12.0m,
                    PlatformCommissionAmount = 69.00m,
                    VendorPayoutAmount = 506.00m,
                    Status = BookingStatus.Active,
                    DepositStatus = DepositStatus.Held,
                    DeliveryAddress = "2100 California Street, Unit 302",
                    DeliveryCity = "San Francisco"
                };

                var booking3 = new Booking
                {
                    BookingReference = "RA-BK-2026-1003",
                    CustomerId = customer3.Id,
                    VendorId = vendor2.Id,
                    ItemId = item3.Id,
                    StartDate = DateTime.UtcNow.AddMonths(-2),
                    EndDate = DateTime.UtcNow.AddMonths(1),
                    RentalDurationMonths = 3,
                    MonthlyRent = 95.00m,
                    SecurityDeposit = 400.00m,
                    TotalAmountPaid = 495.00m,
                    CommissionRateApplied = 10.0m,
                    PlatformCommissionAmount = 49.50m,
                    VendorPayoutAmount = 445.50m,
                    Status = BookingStatus.Active,
                    DepositStatus = DepositStatus.Held,
                    DeliveryAddress = "88 King Street, Loft 510",
                    DeliveryCity = "San Francisco"
                };

                var booking4 = new Booking
                {
                    BookingReference = "RA-BK-2026-1004",
                    CustomerId = customer1.Id,
                    VendorId = vendor1.Id,
                    ItemId = item5.Id,
                    StartDate = DateTime.UtcNow.AddMonths(-4),
                    EndDate = DateTime.UtcNow.AddMonths(-1),
                    RentalDurationMonths = 3,
                    MonthlyRent = 65.00m,
                    SecurityDeposit = 250.00m,
                    TotalAmountPaid = 445.00m,
                    CommissionRateApplied = 12.0m,
                    PlatformCommissionAmount = 53.40m,
                    VendorPayoutAmount = 391.60m,
                    Status = BookingStatus.Completed,
                    DepositStatus = DepositStatus.Refunded,
                    DepositRefundedAmount = 250.00m,
                    DeliveryAddress = "450 Sutter St, Apt 8B",
                    DeliveryCity = "San Francisco"
                };

                context.Bookings.AddRange(booking1, booking2, booking3, booking4);
                await context.SaveChangesAsync();

                // 7. Seed Disputes
                var dispute1 = new Dispute
                {
                    DisputeTicketNumber = "DISP-2026-0041",
                    BookingId = booking1.Id,
                    RaisedByUserId = vendorUser1.Id,
                    Reason = DisputeReason.DamageAssessment,
                    Status = DisputeStatus.Open,
                    ClaimAmount = 350.00m,
                    Description = "Upon pre-return inspection of the Nordic Oak Dining Table, vendor reported severe deep knife scratches and water damage on table surface. Renter claims ordinary wear-and-tear.",
                    CustomerStatement = "The table was used normally with placemats. Slight surface micro-scratches are standard usage over 3 months.",
                    VendorStatement = "Multiple 4-inch deep gouges penetrate through the lacquer and wood veneer. Requires professional resurfacing quote: $350.",
                    EvidencePhotosJson = "[\"https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?w=800&auto=format&fit=crop&q=80\"]"
                };

                var dispute2 = new Dispute
                {
                    DisputeTicketNumber = "DISP-2026-0042",
                    BookingId = booking3.Id,
                    RaisedByUserId = customer3.Id,
                    Reason = DisputeReason.DepositDeduction,
                    Status = DisputeStatus.UnderReview,
                    ClaimAmount = 150.00m,
                    Description = "Customer disputes a $150 compressor sanitization charge added to monthly statement. Appliance was maintained in clean order.",
                    CustomerStatement = "The refrigerator arrived with an existing odor from previous tenant. I was billed an unexpected sanitization fee.",
                    VendorStatement = "Unsealed fish products caused severe internal air filter contamination needing chemical flush.",
                    EvidencePhotosJson = "[\"https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80\"]"
                };

                var dispute3 = new Dispute
                {
                    DisputeTicketNumber = "DISP-2026-0039",
                    BookingId = booking4.Id,
                    RaisedByUserId = customer1.Id,
                    Reason = DisputeReason.LateReturn,
                    Status = DisputeStatus.ResolvedCustomerFavored,
                    ClaimAmount = 50.00m,
                    Description = "Vendor delayed pickup truck by 4 days, then attempted to bill customer for extra rental days.",
                    CustomerStatement = "Item was packed by Oct 1. Vendor's driver did not show up until Oct 5.",
                    VendorStatement = "Truck suffered mechanical breakdown during transit.",
                    AdminDecisionNotes = "Verified dispatch logs confirmed vendor fleet mechanical delay. Late fee cancelled and $50 goodwill credit issued to renter.",
                    RefundToCustomerAmount = 50.00m,
                    PayoutToVendorAmount = 0m,
                    ResolvedByUserId = adminUser.Id,
                    ResolvedAt = DateTime.UtcNow.AddDays(-10)
                };

                context.Disputes.AddRange(dispute1, dispute2, dispute3);
                await context.SaveChangesAsync();

                // 8. Seed Audit Logs
                var auditLogs = new List<AuditLog>
                {
                    new()
                    {
                        Action = "PlatformInitialized",
                        EntityType = "System",
                        EntityId = "V1.0",
                        PerformedByUserName = "Platform Administrator",
                        Details = "RentAssure Multi-Vendor Core Database and Initial Escrow Policies Activated.",
                        Severity = "Info",
                        CreatedAt = DateTime.UtcNow.AddMonths(-3)
                    },
                    new()
                    {
                        Action = "VendorApproved",
                        EntityType = "Vendor",
                        EntityId = vendor1.Id.ToString(),
                        PerformedByUserName = "Platform Administrator",
                        Details = "Verified business credentials and approved 'Urban Living Furniture Co.' for live listings.",
                        Severity = "Info",
                        CreatedAt = DateTime.UtcNow.AddMonths(-3)
                    },
                    new()
                    {
                        Action = "VendorApproved",
                        EntityType = "Vendor",
                        EntityId = vendor2.Id.ToString(),
                        PerformedByUserName = "Platform Administrator",
                        Details = "Approved 'Apex Appliance Depot' with 10% standard category commission.",
                        Severity = "Info",
                        CreatedAt = DateTime.UtcNow.AddMonths(-2)
                    },
                    new()
                    {
                        Action = "VendorSuspended",
                        EntityType = "Vendor",
                        EntityId = vendor5.Id.ToString(),
                        PerformedByUserName = "Platform Administrator",
                        Details = "Suspended 'Bay City Retro Equipment' due to unfulfilled pickup logistics.",
                        Severity = "Critical",
                        CreatedAt = DateTime.UtcNow.AddDays(-20)
                    },
                    new()
                    {
                        Action = "DisputeResolved",
                        EntityType = "Dispute",
                        EntityId = dispute3.DisputeTicketNumber,
                        PerformedByUserName = "Platform Administrator",
                        Details = "Resolved dispute DISP-2026-0039 in favor of renter (late pickup fleet breakdown).",
                        Severity = "Warning",
                        CreatedAt = DateTime.UtcNow.AddDays(-10)
                    }
                };

                context.AuditLogs.AddRange(auditLogs);
                await context.SaveChangesAsync();

                logger.LogInformation("Database seeded successfully with marketplace data!");
            }

            // 7. Ensure rich catalog with 20+ diverse items across categories and cities
            if (await context.RentalItems.CountAsync() < 20)
            {
                var catFurn = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "furniture");
                var catApp = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "appliances");
                var catElec = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "electronics");
                var catFit = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "fitness-events");
                var approvedVendors = await context.Vendors.Where(v => v.Status == VendorStatus.Approved).ToListAsync();

                if (approvedVendors.Any() && catFurn != null && catApp != null && catElec != null && catFit != null)
                {
                    var v1 = approvedVendors[0];
                    var v2 = approvedVendors.Count > 1 ? approvedVendors[1] : v1;

                    var extraItems = new List<RentalItem>
                    {
                        // Furniture
                        new()
                        {
                            VendorId = v1.Id,
                            CategoryId = catFurn.Id,
                            Title = "Kyoto Solid Birch Queen Platform Bed with Upholstered Headboard",
                            Description = "Japanese minimalist low platform bed crafted from kiln-dried solid birch with upholstered oatmeal linen headboard.",
                            Brand = "Muji Style",
                            Model = "Kyoto-Q",
                            Condition = "Brand New",
                            MonthlyRent = 75.00m,
                            SecurityDeposit = 300.00m,
                            MinimumRentalMonths = 3,
                            City = "San Francisco",
                            Area = "Pacific Heights",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 5,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v1.Id,
                            CategoryId = catFurn.Id,
                            Title = "Eames Style Premium Top-Grain Leather Lounge Chair & Ottoman",
                            Description = "Classic mid-century lounge chair with 7-ply molded walnut veneer shell and supple black top-grain Italian leather.",
                            Brand = "Vitra Inspired",
                            Model = "Lounge-E67",
                            Condition = "Like New",
                            MonthlyRent = 95.00m,
                            SecurityDeposit = 400.00m,
                            MinimumRentalMonths = 3,
                            City = "Berkeley",
                            Area = "Downtown",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 7,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v1.Id,
                            CategoryId = catFurn.Id,
                            Title = "Apex Dual-Motor Electric Standing Desk (60x30 Solid Walnut)",
                            Description = "Electric sit-stand desk with 4 programmable memory presets, anti-collision sensor, and cable management tray.",
                            Brand = "ApexDesk",
                            Model = "Vortex 60",
                            Condition = "Brand New",
                            MonthlyRent = 49.00m,
                            SecurityDeposit = 180.00m,
                            MinimumRentalMonths = 1,
                            City = "San Francisco",
                            Area = "Financial District",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 12,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v1.Id,
                            CategoryId = catFurn.Id,
                            Title = "Milo Curved 3-Seater Cloud Boucle Sofa",
                            Description = "Architectural sculptural silhouette dressed in stain-resistant tactile boucle fabric. Ultra-deep plush cushions.",
                            Brand = "Castlery",
                            Model = "Milo-3S",
                            Condition = "Brand New",
                            MonthlyRent = 110.00m,
                            SecurityDeposit = 450.00m,
                            MinimumRentalMonths = 6,
                            City = "Oakland",
                            Area = "Grand Lake",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 3,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80\"]"
                        },

                        // Appliances
                        new()
                        {
                            VendorId = v2.Id,
                            CategoryId = catApp.Id,
                            Title = "Whirlpool 30\" Convection Over-the-Range Microwave & Grill",
                            Description = "Sensor cooking technology, 1.9 cu ft capacity, steam clean function, and integrated multi-speed ventilation exhaust.",
                            Brand = "Whirlpool",
                            Model = "WMH78019HZ",
                            Condition = "Brand New",
                            MonthlyRent = 39.00m,
                            SecurityDeposit = 150.00m,
                            MinimumRentalMonths = 3,
                            City = "Oakland",
                            Area = "Temescal",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 6,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v2.Id,
                            CategoryId = catApp.Id,
                            Title = "Bosch 800 Series Ultra-Quiet 42 dBA Built-in Dishwasher",
                            Description = "CrystalDry technology for moisture-free plastics, RackMatic 3-height system, and PrecisionWash intelligent sensors.",
                            Brand = "Bosch",
                            Model = "SHX78B75UC",
                            Condition = "Brand New",
                            MonthlyRent = 69.00m,
                            SecurityDeposit = 280.00m,
                            MinimumRentalMonths = 3,
                            City = "San Francisco",
                            Area = "Marina",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 4,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v2.Id,
                            CategoryId = catApp.Id,
                            Title = "Dyson Purifier Hot+Cool Formaldehyde Smart Air Purifier HP09",
                            Description = "HEPA H13 filtration capturing 99.97% of allergens, intelligent air quality sensors, ceramic heater & fan.",
                            Brand = "Dyson",
                            Model = "HP09 Gen1",
                            Condition = "Brand New",
                            MonthlyRent = 45.00m,
                            SecurityDeposit = 200.00m,
                            MinimumRentalMonths = 1,
                            City = "San Jose",
                            Area = "Willow Glen",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 9,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v2.Id,
                            CategoryId = catApp.Id,
                            Title = "Breville Barista Touch Impress Espresso Machine Bundle",
                            Description = "Automated touchscreen with step-by-step barista guidance, assisted tamping, and auto MilQ microfoam texturing.",
                            Brand = "Breville",
                            Model = "BES881BSS",
                            Condition = "Like New",
                            MonthlyRent = 55.00m,
                            SecurityDeposit = 220.00m,
                            MinimumRentalMonths = 3,
                            City = "San Francisco",
                            Area = "Noe Valley",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 8,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=800&auto=format&fit=crop&q=80\"]"
                        },

                        // Electronics & AV
                        new()
                        {
                            VendorId = v2.Id,
                            CategoryId = catElec.Id,
                            Title = "LG OLED evo C3 Series 65-Inch 4K HDR Smart Cinema TV",
                            Description = "Alpha 9 Gen 6 AI Processor 4K, 120Hz refresh rate, Dolby Vision IQ & Atmos with ultra-slim gallery wall mount.",
                            Brand = "LG",
                            Model = "OLED65C3PUA",
                            Condition = "Brand New",
                            MonthlyRent = 135.00m,
                            SecurityDeposit = 550.00m,
                            MinimumRentalMonths = 3,
                            City = "San Jose",
                            Area = "Santana Row",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 5,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v1.Id,
                            CategoryId = catElec.Id,
                            Title = "Sony PlayStation 5 Pro Console + 2 DualSense Wireless Controllers",
                            Description = "2TB ultra-fast SSD, advanced ray tracing, 4K 60fps fidelity, charging station and 3 top launch titles included.",
                            Brand = "Sony",
                            Model = "PS5 Pro Edition",
                            Condition = "Brand New",
                            MonthlyRent = 65.00m,
                            SecurityDeposit = 250.00m,
                            MinimumRentalMonths = 1,
                            City = "San Francisco",
                            Area = "Mission Bay",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 14,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v2.Id,
                            CategoryId = catElec.Id,
                            Title = "Apple MacBook Pro 16\" (M3 Max, 64GB RAM, 1TB SSD) Workstation",
                            Description = "High-performance creative powerhouse for 4K video editing, 3D rendering, and AI development with Liquid Retina XDR display.",
                            Brand = "Apple",
                            Model = "MacBook Pro 16",
                            Condition = "Brand New",
                            MonthlyRent = 210.00m,
                            SecurityDeposit = 800.00m,
                            MinimumRentalMonths = 1,
                            City = "San Jose",
                            Area = "North San Jose",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 4,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v1.Id,
                            CategoryId = catElec.Id,
                            Title = "Genelec 8030C Studio Monitors & Universal Audio Apollo Twin Interface",
                            Description = "Reference studio acoustic audio monitor pair with DSP calibration and Apollo Duo Thunderbolt 3 interface.",
                            Brand = "Genelec",
                            Model = "8030C Pro Pair",
                            Condition = "Like New",
                            MonthlyRent = 115.00m,
                            SecurityDeposit = 450.00m,
                            MinimumRentalMonths = 1,
                            City = "San Francisco",
                            Area = "Potrero Hill",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 6,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80\"]"
                        },

                        // Fitness & Events
                        new()
                        {
                            VendorId = v2.Id,
                            CategoryId = catFit.Id,
                            Title = "NordicTrack Commercial 1750 Interactive Folding Treadmill",
                            Description = "14-inch rotating HD touchscreen, -3% decline to 12% incline, Runners Flex cushioning, and AutoAdjust coaching.",
                            Brand = "NordicTrack",
                            Model = "NTL14124",
                            Condition = "Brand New",
                            MonthlyRent = 120.00m,
                            SecurityDeposit = 480.00m,
                            MinimumRentalMonths = 3,
                            City = "Oakland",
                            Area = "Rockridge",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 3,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v1.Id,
                            CategoryId = catFit.Id,
                            Title = "Concept2 RowErg Indoor Rowing Machine with PM5 Performance Monitor",
                            Description = "Standard commercial rowing machine with air-resistance flywheel, PM5 Bluetooth monitor, and ergonomic handle.",
                            Brand = "Concept2",
                            Model = "RowErg Model D",
                            Condition = "Brand New",
                            MonthlyRent = 70.00m,
                            SecurityDeposit = 290.00m,
                            MinimumRentalMonths = 1,
                            City = "Berkeley",
                            Area = "Elmwood",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 9,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v1.Id,
                            CategoryId = catFit.Id,
                            Title = "Epson Pro Cinema 4K Laser Projector + 120\" Motorized Ambient Screen",
                            Description = "3,000 lumens ultra-short throw true laser projector, HDR10+, Yamaha premium sound system, and ALR screen kit.",
                            Brand = "Epson",
                            Model = "LS800B Home Cinema",
                            Condition = "Brand New",
                            MonthlyRent = 160.00m,
                            SecurityDeposit = 600.00m,
                            MinimumRentalMonths = 1,
                            City = "San Francisco",
                            Area = "Castro",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 11,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80\"]"
                        },
                        new()
                        {
                            VendorId = v2.Id,
                            CategoryId = catFit.Id,
                            Title = "JBL PartyBox Stage 320 Bluetooth High-Power Sound & Light Kit",
                            Description = "240W RMS booming sound, dual wireless mic package, dynamic light show, and 18-hour battery for corporate & social events.",
                            Brand = "JBL Professional",
                            Model = "PartyBox 320",
                            Condition = "Brand New",
                            MonthlyRent = 50.00m,
                            SecurityDeposit = 200.00m,
                            MinimumRentalMonths = 1,
                            City = "Oakland",
                            Area = "Jack London Square",
                            Status = ItemStatus.Available,
                            TotalRentalsCount = 15,
                            ImagesJson = "[\"https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80\"]"
                        }
                    };

                    context.RentalItems.AddRange(extraItems);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Enriched catalog with 16 additional diverse rental items!");
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while seeding database");
        }
    }
}
