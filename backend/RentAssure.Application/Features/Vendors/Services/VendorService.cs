using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentAssure.Application.Common.Interfaces;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Bookings.DTOs;
using RentAssure.Application.Features.Items.DTOs;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Application.Features.Vendors.DTOs;
using RentAssure.Domain.Entities;
using RentAssure.Domain.Enums;

namespace RentAssure.Application.Features.Vendors.Services;

public class VendorService : IVendorService
{
    private readonly IApplicationDbContext _context;

    public VendorService(IApplicationDbContext context)
    {
        _context = context;
    }

    private async Task<Vendor?> GetVendorOrFirstAsync(int userId)
    {
        return await _context.Vendors.FirstOrDefaultAsync(v => v.UserId == userId);
    }

    public async Task<ApiResponse<VendorStatusDto>> GetVendorStatusAsync(int userId)
    {
        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.UserId == userId);
        if (vendor == null)
        {
            return ApiResponse<VendorStatusDto>.Success(new VendorStatusDto
            {
                HasProfile = false,
                Status = "None"
            });
        }

        return ApiResponse<VendorStatusDto>.Success(new VendorStatusDto
        {
            HasProfile = true,
            VendorId = vendor.Id,
            StoreName = vendor.StoreName,
            OwnerName = vendor.OwnerName,
            BusinessRegistrationNumber = vendor.BusinessRegistrationNumber,
            Status = vendor.Status.ToString(),
            RejectionReason = vendor.RejectionReason,
            AdminNotes = vendor.AdminNotes,
            PhoneNumber = vendor.PhoneNumber,
            SupportEmail = vendor.SupportEmail,
            Address = vendor.Address,
            City = vendor.City,
            State = vendor.State,
            CreatedAt = vendor.CreatedAt,
            ApprovedAt = vendor.ApprovedAt
        });
    }

    public async Task<ApiResponse<VendorStatusDto>> SubmitVendorOnboardingAsync(int userId, VendorOnboardingRequestDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return ApiResponse<VendorStatusDto>.Fail("User account not found.");
        }

        user.Role = UserRole.Vendor;

        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.UserId == userId);
        if (vendor == null)
        {
            vendor = new Vendor
            {
                UserId = userId,
                StoreName = request.StoreName.Trim(),
                OwnerName = string.IsNullOrWhiteSpace(request.OwnerName) ? user.FullName : request.OwnerName.Trim(),
                BusinessRegistrationNumber = string.IsNullOrWhiteSpace(request.BusinessRegistrationNumber) ? "REG-" + Guid.NewGuid().ToString("N")[..8].ToUpper() : request.BusinessRegistrationNumber.Trim(),
                PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? (user.PhoneNumber ?? "9879786789") : request.PhoneNumber.Trim(),
                SupportEmail = string.IsNullOrWhiteSpace(request.SupportEmail) ? user.Email : request.SupportEmail.Trim(),
                Address = request.Address.Trim(),
                City = string.IsNullOrWhiteSpace(request.City) ? "Ahmedabad" : request.City.Trim(),
                State = string.IsNullOrWhiteSpace(request.State) ? "Gujarat" : request.State.Trim(),
                PostalCode = string.IsNullOrWhiteSpace(request.PostalCode) ? "380001" : request.PostalCode.Trim(),
                Status = VendorStatus.PendingApproval,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var metadata = new
            {
                category = request.StoreCategory ?? "Living Furniture & Sofas",
                experienceYears = request.ExperienceYears ?? "4.7 yrs",
                servicesOffered = request.ServicesOffered ?? "Doorstep Delivery, Setup & Maintenance",
                languages = request.LanguagesSpoken ?? "English, Gujarati, Hindi",
                previousExperience = request.PreviousExperience ?? "Established Retailer",
                documents = !string.IsNullOrWhiteSpace(request.DocumentsJson) ? request.DocumentsJson : "[]"
            };
            vendor.AdminNotes = JsonSerializer.Serialize(metadata);

            _context.Vendors.Add(vendor);
        }
        else
        {
            vendor.StoreName = request.StoreName.Trim();
            if (!string.IsNullOrWhiteSpace(request.OwnerName)) vendor.OwnerName = request.OwnerName.Trim();
            if (!string.IsNullOrWhiteSpace(request.BusinessRegistrationNumber)) vendor.BusinessRegistrationNumber = request.BusinessRegistrationNumber.Trim();
            if (!string.IsNullOrWhiteSpace(request.PhoneNumber)) vendor.PhoneNumber = request.PhoneNumber.Trim();
            if (!string.IsNullOrWhiteSpace(request.SupportEmail)) vendor.SupportEmail = request.SupportEmail.Trim();
            vendor.Address = request.Address.Trim();
            if (!string.IsNullOrWhiteSpace(request.City)) vendor.City = request.City.Trim();
            if (!string.IsNullOrWhiteSpace(request.State)) vendor.State = request.State.Trim();
            if (!string.IsNullOrWhiteSpace(request.PostalCode)) vendor.PostalCode = request.PostalCode.Trim();

            vendor.Status = VendorStatus.PendingApproval;
            vendor.RejectionReason = null;
            vendor.UpdatedAt = DateTime.UtcNow;

            var metadata = new
            {
                category = request.StoreCategory ?? "Living Furniture & Sofas",
                experienceYears = request.ExperienceYears ?? "4.7 yrs",
                servicesOffered = request.ServicesOffered ?? "Doorstep Delivery, Setup & Maintenance",
                languages = request.LanguagesSpoken ?? "English, Gujarati, Hindi",
                previousExperience = request.PreviousExperience ?? "Established Retailer",
                documents = !string.IsNullOrWhiteSpace(request.DocumentsJson) ? request.DocumentsJson : "[]"
            };
            vendor.AdminNotes = JsonSerializer.Serialize(metadata);
        }

        await _context.SaveChangesAsync();

        return ApiResponse<VendorStatusDto>.Success(new VendorStatusDto
        {
            HasProfile = true,
            VendorId = vendor.Id,
            StoreName = vendor.StoreName,
            OwnerName = vendor.OwnerName,
            BusinessRegistrationNumber = vendor.BusinessRegistrationNumber,
            Status = vendor.Status.ToString(),
            PhoneNumber = vendor.PhoneNumber,
            SupportEmail = vendor.SupportEmail,
            Address = vendor.Address,
            City = vendor.City,
            State = vendor.State,
            AdminNotes = vendor.AdminNotes,
            CreatedAt = vendor.CreatedAt,
            ApprovedAt = vendor.ApprovedAt
        }, "Verification application submitted successfully.");
    }

    public async Task<ApiResponse<VendorDashboardMetricsDto>> GetVendorDashboardAsync(int userId)
    {
        var vendor = await GetVendorOrFirstAsync(userId);
        if (vendor == null)
        {
            return ApiResponse<VendorDashboardMetricsDto>.Fail("Vendor profile not found. Please complete store registration.", "NoProfile");
        }

        if (vendor.Status != VendorStatus.Approved)
        {
            return ApiResponse<VendorDashboardMetricsDto>.Fail($"Store is currently {vendor.Status}. Dashboard access requires Admin approval.", "NotApproved");
        }

        var items = await _context.RentalItems
            .AsNoTracking()
            .Include(i => i.Category)
            .Where(i => i.VendorId == vendor.Id)
            .ToListAsync();

        var bookings = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.Item)
            .Include(b => b.Customer)
            .Where(b => b.VendorId == vendor.Id)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var activeRentals = bookings.Where(b => b.Status == BookingStatus.Active || b.Status == BookingStatus.Delivered).ToList();
        var pendingDeliveries = bookings.Count(b => b.Status == BookingStatus.Reserved);
        var pendingReturns = bookings.Count(b => b.Status == BookingStatus.ReturnRequested);

        var commissionRate = vendor.CommissionRateOverride ?? 12.0m;
        var totalGrossRevenue = bookings.Sum(b => b.TotalAmountPaid);
        var totalCommissionPaid = bookings.Sum(b => b.PlatformCommissionAmount);
        var totalNetProfit = bookings.Sum(b => b.VendorPayoutAmount);
        if (totalNetProfit == 0 && vendor.TotalEarnings > 0)
        {
            totalNetProfit = vendor.TotalEarnings;
        }

        var monthlyGross = activeRentals.Sum(b => b.MonthlyRent);
        var monthlyNetProfit = Math.Round(monthlyGross * (1m - (commissionRate / 100m)), 2);

        var escrowHeld = bookings
            .Where(b => (b.Status == BookingStatus.Active || b.Status == BookingStatus.Delivered || b.Status == BookingStatus.ReturnRequested) && b.DepositStatus == DepositStatus.Held)
            .Sum(b => b.SecurityDeposit);

        var profitMargin = totalGrossRevenue > 0
            ? Math.Round((totalNetProfit / totalGrossRevenue) * 100m, 1)
            : Math.Round(100m - commissionRate, 1);

        // Real category distribution for this vendor
        var categoryDist = items
            .GroupBy(i => i.Category?.Name ?? "General")
            .Select(g => new CategoryShareDto
            {
                CategoryName = g.Key,
                ItemCount = g.Count(),
                ActiveBookingsCount = activeRentals.Count(b => b.Item != null && (b.Item.Category?.Name ?? "General") == g.Key),
                TotalVolume = bookings.Where(b => b.Item != null && (b.Item.Category?.Name ?? "General") == g.Key).Sum(b => b.TotalAmountPaid)
            })
            .ToList();

        // Real monthly trends (last 6 months)
        var now = DateTime.UtcNow;
        var monthlyTrends = new List<MonthlyTrendDto>();
        for (int i = 5; i >= 0; i--)
        {
            var targetMonth = now.AddMonths(-i);
            var mBookings = bookings.Where(b => 
                b.CreatedAt.Year == targetMonth.Year && 
                b.CreatedAt.Month == targetMonth.Month).ToList();

            var mGross = mBookings.Sum(b => b.TotalAmountPaid);
            var mComm = mBookings.Sum(b => b.PlatformCommissionAmount);
            var mNet = mBookings.Sum(b => b.VendorPayoutAmount);
            if (mNet == 0 && mGross > 0)
            {
                mNet = Math.Round(mGross * (1m - (commissionRate / 100m)), 2);
            }

            monthlyTrends.Add(new MonthlyTrendDto
            {
                Month = targetMonth.ToString("MMM yyyy"),
                GrossRent = mGross,
                Commission = mComm,
                NetProfit = mNet,
                BookingCount = mBookings.Count
            });
        }

        // Top cities where this vendor's items are booked
        var topCities = bookings
            .GroupBy(b => !string.IsNullOrWhiteSpace(b.DeliveryCity) ? b.DeliveryCity.Trim() : vendor.City)
            .Select(g => new CityBookingStatDto
            {
                City = g.Key,
                BookingCount = g.Count(),
                TotalVolume = g.Sum(b => b.TotalAmountPaid)
            })
            .OrderByDescending(c => c.BookingCount)
            .Take(5)
            .ToList();

        if (topCities.Count == 0 && !string.IsNullOrWhiteSpace(vendor.City))
        {
            topCities.Add(new CityBookingStatDto { City = vendor.City, BookingCount = 0, TotalVolume = 0 });
        }

        // Top Profitable / Performing Items Showcase
        var topProfitableItems = items.Select(item =>
        {
            var itemBookings = bookings.Where(b => b.ItemId == item.Id).ToList();
            var itemGross = itemBookings.Sum(b => b.TotalAmountPaid);
            var itemNet = itemBookings.Sum(b => b.VendorPayoutAmount);
            string? firstImg = null;
            try
            {
                if (!string.IsNullOrWhiteSpace(item.ImagesJson))
                {
                    firstImg = JsonSerializer.Deserialize<List<string>>(item.ImagesJson)?.FirstOrDefault();
                }
            }
            catch { }

            return new VendorProfitableItemDto
            {
                Id = item.Id,
                Title = item.Title,
                CategoryName = item.Category?.Name ?? "General",
                MonthlyRent = item.MonthlyRent,
                TotalRentals = itemBookings.Count > 0 ? itemBookings.Count : item.TotalRentalsCount,
                TotalGrossRevenue = itemGross,
                TotalNetProfit = itemNet > 0 ? itemNet : Math.Round(itemGross * (1m - (commissionRate / 100m)), 2),
                Status = item.Status,
                ImageUrl = firstImg
            };
        })
        .OrderByDescending(p => p.TotalNetProfit)
        .ThenByDescending(p => p.TotalRentals)
        .Take(6)
        .ToList();

        var recentBookings = bookings.Take(5).Select(b => new BookingDetailDto
        {
            Id = b.Id,
            BookingReference = b.BookingReference,
            CustomerName = b.Customer?.FullName ?? "Renter",
            ItemTitle = b.Item?.Title ?? "Rental Item",
            MonthlyRent = b.MonthlyRent,
            Status = b.Status,
            CreatedAt = b.CreatedAt
        }).ToList();

        return ApiResponse<VendorDashboardMetricsDto>.Success(new VendorDashboardMetricsDto
        {
            VendorId = vendor.Id,
            StoreName = vendor.StoreName,
            OwnerName = vendor.OwnerName,
            Status = vendor.Status,
            CommissionRate = commissionRate,
            TotalListings = items.Count,
            ActiveRentalsCount = activeRentals.Count,
            MonthlyGrossRent = monthlyGross,
            MonthlyNetProfit = monthlyNetProfit,
            TotalGrossRevenue = totalGrossRevenue,
            TotalEarnings = totalNetProfit,
            TotalCommissionPaid = totalCommissionPaid,
            EscrowDepositsHeld = escrowHeld,
            ProfitMargin = profitMargin,
            PendingDeliveriesCount = pendingDeliveries,
            PendingReturnsCount = pendingReturns,
            CategoryDistribution = categoryDist,
            MonthlyTrends = monthlyTrends,
            TopCities = topCities,
            RecentBookings = recentBookings,
            TopProfitableItems = topProfitableItems
        });
    }

    public async Task<ApiResponse<List<VendorItemListingDto>>> GetVendorInventoryAsync(int userId)
    {
        var vendor = await GetVendorOrFirstAsync(userId);
        if (vendor == null)
        {
            return ApiResponse<List<VendorItemListingDto>>.Fail("Vendor profile not found.");
        }

        var items = await _context.RentalItems
            .AsNoTracking()
            .Include(i => i.Category)
            .Where(i => i.VendorId == vendor.Id)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        var dtoList = items.Select(i =>
        {
            List<string> images = new();
            try
            {
                if (!string.IsNullOrWhiteSpace(i.ImagesJson))
                {
                    images = JsonSerializer.Deserialize<List<string>>(i.ImagesJson) ?? new();
                }
            }
            catch { }

            return new VendorItemListingDto
            {
                Id = i.Id,
                CategoryId = i.CategoryId,
                CategoryName = i.Category?.Name ?? "General",
                Title = i.Title,
                Description = i.Description,
                Brand = i.Brand,
                Model = i.Model,
                Condition = i.Condition,
                MonthlyRent = i.MonthlyRent,
                SecurityDeposit = i.SecurityDeposit,
                MinimumRentalMonths = i.MinimumRentalMonths,
                Status = i.Status,
                City = i.City,
                Area = i.Area,
                TotalRentalsCount = i.TotalRentalsCount,
                Images = images,
                CreatedAt = i.CreatedAt
            };
        }).ToList();

        return ApiResponse<List<VendorItemListingDto>>.Success(dtoList);
    }

    public async Task<ApiResponse<VendorItemListingDto>> CreateRentalItemAsync(int userId, CreateRentalItemDto request)
    {
        var vendor = await GetVendorOrFirstAsync(userId);
        if (vendor == null)
        {
            return ApiResponse<VendorItemListingDto>.Fail("Vendor profile not found.");
        }

        if (vendor.Status != VendorStatus.Approved)
        {
            return ApiResponse<VendorItemListingDto>.Fail("Your store account is pending verification and must be approved by the admin before listing rental items.", "NotApproved");
        }

        var category = await _context.Categories.FindAsync(request.CategoryId);
        if (category == null)
        {
            return ApiResponse<VendorItemListingDto>.Fail("Category not found.");
        }

        var imagesJson = JsonSerializer.Serialize(request.Images ?? new List<string>());

        var item = new RentalItem
        {
            VendorId = vendor.Id,
            CategoryId = request.CategoryId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Brand = request.Brand?.Trim(),
            Model = request.Model?.Trim(),
            Condition = string.IsNullOrWhiteSpace(request.Condition) ? "Brand New" : request.Condition.Trim(),
            MonthlyRent = request.MonthlyRent,
            SecurityDeposit = request.SecurityDeposit > 0 ? request.SecurityDeposit : Math.Round(request.MonthlyRent * 3m, 2),
            MinimumRentalMonths = request.MinimumRentalMonths > 0 ? request.MinimumRentalMonths : 3,
            City = string.IsNullOrWhiteSpace(request.City) ? vendor.City : request.City.Trim(),
            Area = string.IsNullOrWhiteSpace(request.Area) ? "Main Hub" : request.Area.Trim(),
            ImagesJson = imagesJson,
            Status = ItemStatus.Available
        };

        _context.RentalItems.Add(item);
        await _context.SaveChangesAsync();

        return ApiResponse<VendorItemListingDto>.Success(new VendorItemListingDto
        {
            Id = item.Id,
            CategoryId = item.CategoryId,
            CategoryName = category.Name,
            Title = item.Title,
            Description = item.Description,
            Brand = item.Brand,
            Model = item.Model,
            Condition = item.Condition,
            MonthlyRent = item.MonthlyRent,
            SecurityDeposit = item.SecurityDeposit,
            MinimumRentalMonths = item.MinimumRentalMonths,
            Status = item.Status,
            City = item.City,
            Area = item.Area,
            TotalRentalsCount = 0,
            Images = request.Images ?? new(),
            CreatedAt = item.CreatedAt
        }, "Rental inventory item listed successfully.");
    }

    public async Task<ApiResponse<VendorItemListingDto>> UpdateRentalItemAsync(int userId, int itemId, UpdateRentalItemDto request)
    {
        var vendor = await GetVendorOrFirstAsync(userId);
        if (vendor == null)
        {
            return ApiResponse<VendorItemListingDto>.Fail("Vendor profile not found.");
        }

        var item = await _context.RentalItems
            .Include(i => i.Category)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.VendorId == vendor.Id);

        if (item == null)
        {
            return ApiResponse<VendorItemListingDto>.Fail("Rental item not found in vendor catalog.");
        }

        if (request.CategoryId > 0 && request.CategoryId != item.CategoryId)
        {
            var newCategory = await _context.Categories.FindAsync(request.CategoryId);
            if (newCategory != null)
            {
                item.CategoryId = request.CategoryId;
                item.Category = newCategory;
            }
        }

        item.Title = request.Title.Trim();
        item.Description = request.Description.Trim();
        item.Brand = request.Brand?.Trim();
        item.Model = request.Model?.Trim();
        item.Condition = string.IsNullOrWhiteSpace(request.Condition) ? "Brand New" : request.Condition.Trim();
        item.MonthlyRent = request.MonthlyRent;
        item.SecurityDeposit = request.SecurityDeposit > 0 ? request.SecurityDeposit : Math.Round(request.MonthlyRent * 3m, 2);
        item.MinimumRentalMonths = request.MinimumRentalMonths > 0 ? request.MinimumRentalMonths : 3;
        item.City = string.IsNullOrWhiteSpace(request.City) ? vendor.City : request.City.Trim();
        item.Area = string.IsNullOrWhiteSpace(request.Area) ? "Main Hub" : request.Area.Trim();
        item.Status = request.Status;

        if (request.Images != null)
        {
            item.ImagesJson = JsonSerializer.Serialize(request.Images);
        }

        await _context.SaveChangesAsync();

        List<string> images = new();
        try
        {
            images = JsonSerializer.Deserialize<List<string>>(item.ImagesJson) ?? new();
        }
        catch { }

        return ApiResponse<VendorItemListingDto>.Success(new VendorItemListingDto
        {
            Id = item.Id,
            CategoryId = item.CategoryId,
            CategoryName = item.Category?.Name ?? "General",
            Title = item.Title,
            Description = item.Description,
            Brand = item.Brand,
            Model = item.Model,
            Condition = item.Condition,
            MonthlyRent = item.MonthlyRent,
            SecurityDeposit = item.SecurityDeposit,
            MinimumRentalMonths = item.MinimumRentalMonths,
            Status = item.Status,
            City = item.City,
            Area = item.Area,
            TotalRentalsCount = item.TotalRentalsCount,
            Images = images,
            CreatedAt = item.CreatedAt
        }, "Listing updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteRentalItemAsync(int userId, int itemId)
    {
        var vendor = await GetVendorOrFirstAsync(userId);
        if (vendor == null)
        {
            return ApiResponse<bool>.Fail("Vendor profile not found.");
        }

        var item = await _context.RentalItems.FirstOrDefaultAsync(i => i.Id == itemId && i.VendorId == vendor.Id);
        if (item == null)
        {
            return ApiResponse<bool>.Fail("Rental item not found.");
        }

        // Check if there are active bookings
        var hasActiveBooking = await _context.Bookings.AnyAsync(b => b.ItemId == itemId &&
            (b.Status == BookingStatus.Active || b.Status == BookingStatus.Delivered || b.Status == BookingStatus.Reserved));

        if (hasActiveBooking)
        {
            item.Status = ItemStatus.Inactive;
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.Success(true, "Item is currently linked to bookings and has been marked Inactive.");
        }

        item.Status = ItemStatus.Inactive;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Success(true, "Listing removed from catalog.");
    }

    public async Task<ApiResponse<List<BookingDetailDto>>> GetVendorBookingsAsync(int userId)
    {
        var vendor = await GetVendorOrFirstAsync(userId);
        if (vendor == null)
        {
            return ApiResponse<List<BookingDetailDto>>.Fail("Vendor profile not found.");
        }

        var bookings = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.Item)
            .Include(b => b.Customer)
            .Where(b => b.VendorId == vendor.Id)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var dtoList = bookings.Select(b =>
        {
            string img = "";
            try
            {
                if (b.Item != null && !string.IsNullOrWhiteSpace(b.Item.ImagesJson))
                {
                    img = JsonSerializer.Deserialize<List<string>>(b.Item.ImagesJson)?.FirstOrDefault() ?? "";
                }
            }
            catch { }

            return new BookingDetailDto
            {
                Id = b.Id,
                BookingReference = b.BookingReference,
                CustomerId = b.CustomerId,
                CustomerName = b.Customer?.FullName ?? "Renter",
                CustomerEmail = b.Customer?.Email ?? "",
                CustomerPhone = b.Customer?.PhoneNumber,
                VendorId = b.VendorId,
                VendorStoreName = vendor.StoreName,
                VendorCity = vendor.City,
                ItemId = b.ItemId,
                ItemTitle = b.Item?.Title ?? "Rental Item",
                ItemImageUrl = img,
                StartDate = b.StartDate,
                EndDate = b.EndDate,
                RentalDurationMonths = b.RentalDurationMonths,
                MonthlyRent = b.MonthlyRent,
                SecurityDeposit = b.SecurityDeposit,
                TotalAmountPaid = b.TotalAmountPaid,
                CommissionRateApplied = b.CommissionRateApplied,
                PlatformCommissionAmount = b.PlatformCommissionAmount,
                VendorPayoutAmount = b.VendorPayoutAmount,
                Status = b.Status,
                DepositStatus = b.DepositStatus,
                DepositRefundedAmount = b.DepositRefundedAmount,
                DepositDeductedAmount = b.DepositDeductedAmount,
                DeliveryAddress = b.DeliveryAddress,
                DeliveryCity = b.DeliveryCity,
                VendorNotes = b.VendorNotes,
                CreatedAt = b.CreatedAt
            };
        }).ToList();

        return ApiResponse<List<BookingDetailDto>>.Success(dtoList);
    }

    public async Task<ApiResponse<BookingDetailDto>> UpdateBookingStatusAsync(int userId, int bookingId, UpdateVendorOrderStatusDto request)
    {
        var vendor = await GetVendorOrFirstAsync(userId);
        if (vendor == null)
        {
            return ApiResponse<BookingDetailDto>.Fail("Vendor profile not found.");
        }

        var booking = await _context.Bookings
            .Include(b => b.Item)
            .Include(b => b.Customer)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.VendorId == vendor.Id);

        if (booking == null)
        {
            return ApiResponse<BookingDetailDto>.Fail("Booking not found.");
        }

        booking.Status = request.Status;
        if (!string.IsNullOrWhiteSpace(request.VendorNotes))
        {
            booking.VendorNotes = request.VendorNotes.Trim();
        }

        // If returned or completed, make item available again and release deposit
        if (request.Status == BookingStatus.Completed || request.Status == BookingStatus.PickedUp)
        {
            if (booking.Item != null)
            {
                booking.Item.Status = ItemStatus.Available;
            }
            if (request.Status == BookingStatus.Completed)
            {
                booking.DepositStatus = DepositStatus.Refunded;
                booking.DepositRefundedAmount = booking.SecurityDeposit;
            }
        }

        await _context.SaveChangesAsync();

        string img = "";
        try
        {
            if (booking.Item != null && !string.IsNullOrWhiteSpace(booking.Item.ImagesJson))
            {
                img = JsonSerializer.Deserialize<List<string>>(booking.Item.ImagesJson)?.FirstOrDefault() ?? "";
            }
        }
        catch { }

        return ApiResponse<BookingDetailDto>.Success(new BookingDetailDto
        {
            Id = booking.Id,
            BookingReference = booking.BookingReference,
            CustomerId = booking.CustomerId,
            CustomerName = booking.Customer?.FullName ?? "Renter",
            CustomerEmail = booking.Customer?.Email ?? "",
            CustomerPhone = booking.Customer?.PhoneNumber,
            VendorId = booking.VendorId,
            VendorStoreName = vendor.StoreName,
            VendorCity = vendor.City,
            ItemId = booking.ItemId,
            ItemTitle = booking.Item?.Title ?? "Rental Item",
            ItemImageUrl = img,
            StartDate = booking.StartDate,
            EndDate = booking.EndDate,
            RentalDurationMonths = booking.RentalDurationMonths,
            MonthlyRent = booking.MonthlyRent,
            SecurityDeposit = booking.SecurityDeposit,
            TotalAmountPaid = booking.TotalAmountPaid,
            CommissionRateApplied = booking.CommissionRateApplied,
            PlatformCommissionAmount = booking.PlatformCommissionAmount,
            VendorPayoutAmount = booking.VendorPayoutAmount,
            Status = booking.Status,
            DepositStatus = booking.DepositStatus,
            DepositRefundedAmount = booking.DepositRefundedAmount,
            DepositDeductedAmount = booking.DepositDeductedAmount,
            DeliveryAddress = booking.DeliveryAddress,
            DeliveryCity = booking.DeliveryCity,
            VendorNotes = booking.VendorNotes,
            CreatedAt = booking.CreatedAt
        }, $"Order status updated to {request.Status}.");
    }

    public async Task<ApiResponse<VendorProfileUpdateDto>> UpdateVendorProfileAsync(int userId, VendorProfileUpdateDto request)
    {
        var vendor = await GetVendorOrFirstAsync(userId);
        if (vendor == null)
        {
            return ApiResponse<VendorProfileUpdateDto>.Fail("Vendor profile not found.");
        }

        vendor.StoreName = request.StoreName.Trim();
        vendor.PhoneNumber = request.PhoneNumber.Trim();
        vendor.SupportEmail = request.SupportEmail.Trim();
        vendor.Address = request.Address.Trim();
        vendor.City = request.City.Trim();
        vendor.State = request.State.Trim();
        vendor.PostalCode = request.PostalCode.Trim();

        await _context.SaveChangesAsync();

        return ApiResponse<VendorProfileUpdateDto>.Success(request, "Store profile updated successfully.");
    }
}
