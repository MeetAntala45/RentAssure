using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RentAssure.Application.Common.Interfaces;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Domain.Entities;
using RentAssure.Domain.Enums;

namespace RentAssure.Application.Features.Admin.Services;

public class AdminService : IAdminService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<AdminService> _logger;

    public AdminService(IApplicationDbContext context, ILogger<AdminService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Dashboard & Metrics

    public async Task<ApiResponse<AdminDashboardStatsDto>> GetDashboardStatsAsync()
    {
        var bookings = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Vendor)
            .Include(b => b.Item)
            .ToListAsync();

        var vendors = await _context.Vendors
            .Include(v => v.RentalItems)
            .Include(v => v.Bookings)
            .ToListAsync();

        var disputes = await _context.Disputes
            .Include(d => d.Booking)
            .ThenInclude(b => b.Item)
            .Include(d => d.RaisedByUser)
            .ToListAsync();

        var categories = await _context.Categories
            .Include(c => c.RentalItems)
            .ToListAsync();

        var auditLogs = await _context.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(8)
            .ToListAsync();

        var totalCustomersCount = await _context.Users
            .CountAsync(u => u.Role == UserRole.Customer);

        var totalGross = bookings.Sum(b => b.TotalAmountPaid);
        var totalCommission = bookings.Sum(b => b.PlatformCommissionAmount);
        var totalPayouts = bookings.Sum(b => b.VendorPayoutAmount);
        var activeRentals = bookings.Count(b => b.Status == BookingStatus.Active || b.Status == BookingStatus.Delivered);
        
        // Escrow: Security deposit held on active/reserved/return-requested bookings
        var escrowHeld = bookings
            .Where(b => b.DepositStatus == DepositStatus.Held)
            .Sum(b => b.SecurityDeposit);

        // Monthly trends (grouping by last 6 months)
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
            monthlyTrends.Add(new MonthlyTrendDto
            {
                Month = targetMonth.ToString("MMM yyyy"),
                GrossRent = mGross,
                Commission = mComm,
                NetProfit = mComm > 0 ? mComm : Math.Round(mGross * 0.12m, 2),
                BookingCount = mBookings.Count
            });
        }

        // Category distribution
        var categoryDist = categories.Select(c =>
        {
            var catItemIds = c.RentalItems.Select(i => i.Id).ToHashSet();
            var catBookings = bookings.Where(b => catItemIds.Contains(b.ItemId)).ToList();
            return new CategoryShareDto
            {
                CategoryId = c.Id,
                CategoryName = c.Name,
                ItemCount = c.RentalItems.Count,
                ActiveBookingsCount = catBookings.Count(b => b.Status == BookingStatus.Active || b.Status == BookingStatus.Delivered),
                TotalVolume = catBookings.Sum(b => b.TotalAmountPaid)
            };
        }).ToList();

        var urgentApprovals = vendors
            .Where(v => v.Status == VendorStatus.PendingApproval)
            .OrderBy(v => v.CreatedAt)
            .Take(5)
            .Select(MapToVendorSummary)
            .ToList();

        var activeDisputes = disputes
            .Where(d => d.Status == DisputeStatus.Open || d.Status == DisputeStatus.UnderReview)
            .OrderByDescending(d => d.CreatedAt)
            .Take(5)
            .Select(MapToDisputeSummary)
            .ToList();

        var recentBookings = bookings
            .OrderByDescending(b => b.CreatedAt)
            .Take(6)
            .Select(MapToBookingSummary)
            .ToList();

        var recentActivities = auditLogs
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                Action = a.Action,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                PerformedByUserName = a.PerformedByUserName,
                Details = a.Details,
                Severity = a.Severity,
                CreatedAt = a.CreatedAt
            }).ToList();

        var topCities = bookings
            .GroupBy(b => !string.IsNullOrWhiteSpace(b.DeliveryCity) ? b.DeliveryCity.Trim() : (!string.IsNullOrWhiteSpace(b.Vendor?.City) ? b.Vendor.City.Trim() : "San Francisco"))
            .Select(g => new CityBookingStatDto
            {
                City = g.Key,
                BookingCount = g.Count(),
                TotalVolume = g.Sum(b => b.TotalAmountPaid)
            })
            .OrderByDescending(c => c.BookingCount)
            .Take(6)
            .ToList();

        if (topCities.Count == 0)
        {
            topCities = new List<CityBookingStatDto>
            {
                new() { City = "San Francisco", BookingCount = 0, TotalVolume = 0 },
                new() { City = "San Jose", BookingCount = 0, TotalVolume = 0 },
                new() { City = "Oakland", BookingCount = 0, TotalVolume = 0 },
                new() { City = "Berkeley", BookingCount = 0, TotalVolume = 0 }
            };
        }

        var topPartners = vendors
            .Where(v => v.Status == VendorStatus.Approved)
            .Select(v => new TopPartnerStatDto
            {
                VendorId = v.Id,
                StoreName = v.StoreName,
                OwnerName = v.OwnerName,
                Category = "Verified Merchant",
                CompletedBookings = v.Bookings.Count(b => b.Status == BookingStatus.Completed || b.Status == BookingStatus.PickedUp || b.Status == BookingStatus.Active || b.Status == BookingStatus.Delivered),
                TotalEarnings = v.TotalEarnings
            })
            .OrderByDescending(p => p.CompletedBookings)
            .ThenByDescending(p => p.TotalEarnings)
            .Take(5)
            .ToList();

        var stats = new AdminDashboardStatsDto
        {
            TotalGrossVolume = totalGross,
            PlatformCommissionEarned = totalCommission,
            EscrowBalanceHeld = escrowHeld,
            VendorPayoutsCompleted = totalPayouts,
            ActiveRentalsCount = activeRentals,
            TotalVendorsCount = vendors.Count,
            PendingApprovalsCount = vendors.Count(v => v.Status == VendorStatus.PendingApproval),
            ApprovedVendorsCount = vendors.Count(v => v.Status == VendorStatus.Approved),
            TotalCustomersCount = totalCustomersCount,
            OpenDisputesCount = disputes.Count(d => d.Status == DisputeStatus.Open || d.Status == DisputeStatus.UnderReview),
            MonthlyTrends = monthlyTrends,
            CategoryDistribution = categoryDist,
            TopCities = topCities,
            TopPartners = topPartners,
            UrgentVendorApprovals = urgentApprovals,
            ActiveDisputesQueue = activeDisputes,
            RecentBookings = recentBookings,
            RecentActivities = recentActivities
        };

        return ApiResponse<AdminDashboardStatsDto>.Success(stats);
    }

    #endregion

    #region Vendor Operations

    public async Task<ApiResponse<PagedResult<VendorSummaryDto>>> GetVendorsAsync(
        VendorStatus? status, string? search, int page = 1, int pageSize = 10)
    {
        var query = _context.Vendors
            .Include(v => v.RentalItems)
            .Include(v => v.Bookings)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(v => v.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(v =>
                v.StoreName.ToLower().Contains(s) ||
                v.OwnerName.ToLower().Contains(s) ||
                v.City.ToLower().Contains(s) ||
                v.SupportEmail.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => MapToVendorSummary(v))
            .ToListAsync();

        return ApiResponse<PagedResult<VendorSummaryDto>>.Success(new PagedResult<VendorSummaryDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ApiResponse<VendorDetailDto>> GetVendorByIdAsync(int vendorId)
    {
        var vendor = await _context.Vendors
            .Include(v => v.RentalItems)
                .ThenInclude(i => i.Category)
            .Include(v => v.Bookings)
                .ThenInclude(b => b.Customer)
            .Include(v => v.Bookings)
                .ThenInclude(b => b.Item)
            .FirstOrDefaultAsync(v => v.Id == vendorId);

        if (vendor == null)
            return ApiResponse<VendorDetailDto>.Fail("Vendor not found.", "NotFound");

        var detail = new VendorDetailDto
        {
            Id = vendor.Id,
            UserId = vendor.UserId,
            StoreName = vendor.StoreName,
            OwnerName = vendor.OwnerName,
            PhoneNumber = vendor.PhoneNumber,
            SupportEmail = vendor.SupportEmail,
            Address = vendor.Address,
            City = vendor.City,
            State = vendor.State,
            PostalCode = vendor.PostalCode,
            BusinessRegistrationNumber = vendor.BusinessRegistrationNumber,
            Status = vendor.Status,
            CommissionRateOverride = vendor.CommissionRateOverride,
            TotalEarnings = vendor.TotalEarnings,
            TotalCommissionPaid = vendor.TotalCommissionPaid,
            TotalItemsCount = vendor.RentalItems.Count,
            ActiveBookingsCount = vendor.Bookings.Count(b => b.Status == BookingStatus.Active || b.Status == BookingStatus.Delivered),
            CreatedAt = vendor.CreatedAt,
            ApprovedAt = vendor.ApprovedAt,
            RejectionReason = vendor.RejectionReason,
            AdminNotes = vendor.AdminNotes,
            StripeAccountId = vendor.StripeAccountId,
            IsStripePayoutEnabled = vendor.IsStripePayoutEnabled,
            Items = vendor.RentalItems.Select(i => new ItemSummaryDto
            {
                Id = i.Id,
                Title = i.Title,
                CategoryName = i.Category?.Name ?? "General",
                Condition = i.Condition,
                MonthlyRent = i.MonthlyRent,
                SecurityDeposit = i.SecurityDeposit,
                MinimumRentalMonths = i.MinimumRentalMonths,
                Status = i.Status,
                City = i.City,
                TotalRentalsCount = i.TotalRentalsCount,
                ImagesJson = i.ImagesJson
            }).ToList(),
            RecentBookings = vendor.Bookings
                .OrderByDescending(b => b.CreatedAt)
                .Take(10)
                .Select(MapToBookingSummary)
                .ToList()
        };

        return ApiResponse<VendorDetailDto>.Success(detail);
    }

    public async Task<ApiResponse<VendorSummaryDto>> ApproveVendorAsync(
        int vendorId, VendorApprovalRequestDto request, int adminUserId, string adminName)
    {
        var vendor = await _context.Vendors
            .Include(v => v.RentalItems)
            .Include(v => v.Bookings)
            .Include(v => v.User)
            .FirstOrDefaultAsync(v => v.Id == vendorId);

        if (vendor == null)
            return ApiResponse<VendorSummaryDto>.Fail("Vendor not found.", "NotFound");

        vendor.Status = VendorStatus.Approved;
        vendor.ApprovedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(request.AdminNotes))
        {
            vendor.AdminNotes = request.AdminNotes;
        }

        // Ensure user role is Vendor
        if (vendor.User != null)
        {
            vendor.User.Role = UserRole.Vendor;
        }

        await AddAuditLogAsync("VendorApproved", "Vendor", vendor.Id.ToString(), adminUserId, adminName,
            $"Vendor '{vendor.StoreName}' was approved for live marketplace listings.", "Info");

        await _context.SaveChangesAsync();
        _logger.LogInformation("Admin {Admin} approved vendor {VendorId}", adminName, vendorId);

        return ApiResponse<VendorSummaryDto>.Success(MapToVendorSummary(vendor), "Vendor approved successfully.");
    }

    public async Task<ApiResponse<VendorSummaryDto>> RejectVendorAsync(
        int vendorId, VendorRejectionRequestDto request, int adminUserId, string adminName)
    {
        var vendor = await _context.Vendors
            .Include(v => v.RentalItems)
            .Include(v => v.Bookings)
            .FirstOrDefaultAsync(v => v.Id == vendorId);

        if (vendor == null)
            return ApiResponse<VendorSummaryDto>.Fail("Vendor not found.", "NotFound");

        vendor.Status = VendorStatus.Rejected;
        vendor.RejectionReason = request.Reason;

        await AddAuditLogAsync("VendorRejected", "Vendor", vendor.Id.ToString(), adminUserId, adminName,
            $"Vendor '{vendor.StoreName}' onboarding rejected. Reason: {request.Reason}", "Warning");

        await _context.SaveChangesAsync();
        return ApiResponse<VendorSummaryDto>.Success(MapToVendorSummary(vendor), "Vendor application rejected.");
    }

    public async Task<ApiResponse<VendorSummaryDto>> SuspendVendorAsync(
        int vendorId, VendorSuspensionRequestDto request, int adminUserId, string adminName)
    {
        var vendor = await _context.Vendors
            .Include(v => v.RentalItems)
            .Include(v => v.Bookings)
            .FirstOrDefaultAsync(v => v.Id == vendorId);

        if (vendor == null)
            return ApiResponse<VendorSummaryDto>.Fail("Vendor not found.", "NotFound");

        vendor.Status = VendorStatus.Suspended;
        vendor.AdminNotes = string.IsNullOrWhiteSpace(vendor.AdminNotes)
            ? $"Suspended: {request.Reason}"
            : $"{vendor.AdminNotes}\nSuspended: {request.Reason}";

        await AddAuditLogAsync("VendorSuspended", "Vendor", vendor.Id.ToString(), adminUserId, adminName,
            $"Vendor '{vendor.StoreName}' suspended. Reason: {request.Reason}", "Critical");

        await _context.SaveChangesAsync();
        return ApiResponse<VendorSummaryDto>.Success(MapToVendorSummary(vendor), "Vendor suspended successfully.");
    }

    public async Task<ApiResponse<VendorSummaryDto>> UpdateVendorCommissionAsync(
        int vendorId, VendorCommissionUpdateRequestDto request, int adminUserId, string adminName)
    {
        var vendor = await _context.Vendors
            .Include(v => v.RentalItems)
            .Include(v => v.Bookings)
            .FirstOrDefaultAsync(v => v.Id == vendorId);

        if (vendor == null)
            return ApiResponse<VendorSummaryDto>.Fail("Vendor not found.", "NotFound");

        var oldRate = vendor.CommissionRateOverride;
        vendor.CommissionRateOverride = request.CommissionRate;

        await AddAuditLogAsync("CommissionOverrideUpdated", "Vendor", vendor.Id.ToString(), adminUserId, adminName,
            $"Updated commission override for '{vendor.StoreName}' from {oldRate?.ToString() ?? "Default"}% to {request.CommissionRate?.ToString() ?? "Default"}%", "Info");

        await _context.SaveChangesAsync();
        return ApiResponse<VendorSummaryDto>.Success(MapToVendorSummary(vendor), "Commission override updated.");
    }

    #endregion

    #region Dispute Resolution

    public async Task<ApiResponse<PagedResult<DisputeSummaryDto>>> GetDisputesAsync(
        DisputeStatus? status, string? search, int page = 1, int pageSize = 10)
    {
        var query = _context.Disputes
            .Include(d => d.Booking)
                .ThenInclude(b => b.Item)
            .Include(d => d.Booking)
                .ThenInclude(b => b.Vendor)
            .Include(d => d.RaisedByUser)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(d => d.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(d =>
                d.DisputeTicketNumber.ToLower().Contains(s) ||
                d.Booking.BookingReference.ToLower().Contains(s) ||
                d.RaisedByUser.FullName.ToLower().Contains(s) ||
                d.Booking.Vendor.StoreName.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => MapToDisputeSummary(d))
            .ToListAsync();

        return ApiResponse<PagedResult<DisputeSummaryDto>>.Success(new PagedResult<DisputeSummaryDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ApiResponse<DisputeDetailDto>> GetDisputeByIdAsync(int disputeId)
    {
        var dispute = await _context.Disputes
            .Include(d => d.Booking)
                .ThenInclude(b => b.Item)
            .Include(d => d.Booking)
                .ThenInclude(b => b.Customer)
            .Include(d => d.Booking)
                .ThenInclude(b => b.Vendor)
            .Include(d => d.RaisedByUser)
            .Include(d => d.ResolvedByUser)
            .FirstOrDefaultAsync(d => d.Id == disputeId);

        if (dispute == null)
            return ApiResponse<DisputeDetailDto>.Fail("Dispute not found.", "NotFound");

        var detail = new DisputeDetailDto
        {
            Id = dispute.Id,
            DisputeTicketNumber = dispute.DisputeTicketNumber,
            BookingId = dispute.BookingId,
            BookingReference = dispute.Booking.BookingReference,
            ItemTitle = dispute.Booking.Item?.Title ?? "N/A",
            CustomerName = dispute.Booking.Customer?.FullName ?? "N/A",
            VendorStoreName = dispute.Booking.Vendor?.StoreName ?? "N/A",
            Reason = dispute.Reason,
            Status = dispute.Status,
            ClaimAmount = dispute.ClaimAmount,
            DepositHeld = dispute.Booking.SecurityDeposit,
            Description = dispute.Description,
            EvidencePhotosJson = dispute.EvidencePhotosJson,
            CustomerStatement = dispute.CustomerStatement,
            VendorStatement = dispute.VendorStatement,
            AdminDecisionNotes = dispute.AdminDecisionNotes,
            RefundToCustomerAmount = dispute.RefundToCustomerAmount,
            PayoutToVendorAmount = dispute.PayoutToVendorAmount,
            ResolvedByUserName = dispute.ResolvedByUser?.FullName,
            CreatedAt = dispute.CreatedAt,
            ResolvedAt = dispute.ResolvedAt,
            Booking = MapToBookingSummary(dispute.Booking)
        };

        return ApiResponse<DisputeDetailDto>.Success(detail);
    }

    public async Task<ApiResponse<DisputeDetailDto>> ResolveDisputeAsync(
        int disputeId, ResolveDisputeRequestDto request, int adminUserId, string adminName)
    {
        var dispute = await _context.Disputes
            .Include(d => d.Booking)
                .ThenInclude(b => b.Item)
            .Include(d => d.Booking)
                .ThenInclude(b => b.Customer)
            .Include(d => d.Booking)
                .ThenInclude(b => b.Vendor)
            .Include(d => d.RaisedByUser)
            .FirstOrDefaultAsync(d => d.Id == disputeId);

        if (dispute == null)
            return ApiResponse<DisputeDetailDto>.Fail("Dispute not found.", "NotFound");

        if (dispute.Status == DisputeStatus.ResolvedCustomerFavored ||
            dispute.Status == DisputeStatus.ResolvedVendorFavored ||
            dispute.Status == DisputeStatus.SplitResolution ||
            dispute.Status == DisputeStatus.Closed)
        {
            return ApiResponse<DisputeDetailDto>.Fail("Dispute is already resolved.", "AlreadyResolved");
        }

        dispute.Status = request.Decision;
        dispute.RefundToCustomerAmount = request.RefundToCustomerAmount;
        dispute.PayoutToVendorAmount = request.PayoutToVendorAmount;
        dispute.AdminDecisionNotes = request.AdminNotes;
        dispute.ResolvedByUserId = adminUserId;
        dispute.ResolvedAt = DateTime.UtcNow;

        // Synchronize Booking deposit outcome
        var booking = dispute.Booking;
        if (booking != null)
        {
            booking.DepositRefundedAmount = request.RefundToCustomerAmount;
            booking.DepositDeductedAmount = request.PayoutToVendorAmount;

            if (request.RefundToCustomerAmount > 0 && request.PayoutToVendorAmount > 0)
            {
                booking.DepositStatus = DepositStatus.PartiallyRefunded;
            }
            else if (request.RefundToCustomerAmount >= booking.SecurityDeposit)
            {
                booking.DepositStatus = DepositStatus.Refunded;
            }
            else if (request.PayoutToVendorAmount > 0)
            {
                booking.DepositStatus = DepositStatus.Deducted;
            }
        }

        await AddAuditLogAsync("DisputeResolved", "Dispute", dispute.DisputeTicketNumber, adminUserId, adminName,
            $"Resolved dispute '{dispute.DisputeTicketNumber}' as {dispute.Status}. Customer Refund: ${request.RefundToCustomerAmount:N2}, Vendor Payout: ${request.PayoutToVendorAmount:N2}. Notes: {request.AdminNotes}", "Warning");

        await _context.SaveChangesAsync();
        _logger.LogInformation("Admin {Admin} resolved dispute {DisputeId} with status {Status}",
            adminName, disputeId, dispute.Status);

        return await GetDisputeByIdAsync(disputeId);
    }

    #endregion

    #region Bookings Oversight

    public async Task<ApiResponse<PagedResult<BookingSummaryDto>>> GetBookingsAsync(
        BookingStatus? status, string? search, int page = 1, int pageSize = 10)
    {
        var query = _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Vendor)
            .Include(b => b.Item)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(b => b.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(b =>
                b.BookingReference.ToLower().Contains(s) ||
                b.Customer.FullName.ToLower().Contains(s) ||
                b.Vendor.StoreName.ToLower().Contains(s) ||
                b.Item.Title.ToLower().Contains(s) ||
                b.DeliveryCity.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => MapToBookingSummary(b))
            .ToListAsync();

        return ApiResponse<PagedResult<BookingSummaryDto>>.Success(new PagedResult<BookingSummaryDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ApiResponse<BookingSummaryDto>> GetBookingByIdAsync(int bookingId)
    {
        var booking = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Vendor)
            .Include(b => b.Item)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        if (booking == null)
            return ApiResponse<BookingSummaryDto>.Fail("Booking not found.", "NotFound");

        return ApiResponse<BookingSummaryDto>.Success(MapToBookingSummary(booking));
    }

    #endregion

    #region Category Management

    public async Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync()
    {
        var categories = await _context.Categories
            .Include(c => c.RentalItems)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                Icon = c.Icon,
                CommissionRate = c.CommissionRate,
                IsActive = c.IsActive,
                ItemCount = c.RentalItems.Count
            })
            .ToListAsync();

        return ApiResponse<List<CategoryDto>>.Success(categories);
    }

    public async Task<ApiResponse<CategoryDto>> CreateCategoryAsync(
        CreateOrUpdateCategoryDto request, int adminUserId, string adminName)
    {
        var slug = GenerateSlug(request.Name);
        var exists = await _context.Categories.AnyAsync(c => c.Slug == slug);
        if (exists)
        {
            slug = $"{slug}-{DateTime.UtcNow.Ticks % 1000}";
        }

        var category = new Category
        {
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description,
            Icon = request.Icon,
            CommissionRate = request.CommissionRate,
            IsActive = request.IsActive
        };

        _context.Categories.Add(category);
        await AddAuditLogAsync("CategoryCreated", "Category", category.Name, adminUserId, adminName,
            $"Created category '{category.Name}' with {category.CommissionRate}% default commission.", "Info");

        await _context.SaveChangesAsync();

        return ApiResponse<CategoryDto>.Success(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            Icon = category.Icon,
            CommissionRate = category.CommissionRate,
            IsActive = category.IsActive,
            ItemCount = 0
        }, "Category created successfully.");
    }

    public async Task<ApiResponse<CategoryDto>> UpdateCategoryAsync(
        int id, CreateOrUpdateCategoryDto request, int adminUserId, string adminName)
    {
        var category = await _context.Categories
            .Include(c => c.RentalItems)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return ApiResponse<CategoryDto>.Fail("Category not found.", "NotFound");

        category.Name = request.Name.Trim();
        category.Description = request.Description;
        category.Icon = request.Icon;
        category.CommissionRate = request.CommissionRate;
        category.IsActive = request.IsActive;

        await AddAuditLogAsync("CategoryUpdated", "Category", category.Id.ToString(), adminUserId, adminName,
            $"Updated category '{category.Name}' commission to {category.CommissionRate}%.", "Info");

        await _context.SaveChangesAsync();

        return ApiResponse<CategoryDto>.Success(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            Icon = category.Icon,
            CommissionRate = category.CommissionRate,
            IsActive = category.IsActive,
            ItemCount = category.RentalItems.Count
        }, "Category updated successfully.");
    }

    public async Task<ApiResponse<bool>> ToggleCategoryStatusAsync(
        int id, int adminUserId, string adminName)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return ApiResponse<bool>.Fail("Category not found.", "NotFound");

        category.IsActive = !category.IsActive;

        await AddAuditLogAsync("CategoryToggled", "Category", category.Id.ToString(), adminUserId, adminName,
            $"Category '{category.Name}' is now {(category.IsActive ? "Active" : "Inactive")}.", "Info");

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Success(category.IsActive, $"Category set to {(category.IsActive ? "Active" : "Inactive")}.");
    }

    #endregion

    #region Platform Settings

    public async Task<ApiResponse<List<PlatformSettingDto>>> GetSettingsAsync()
    {
        var settings = await _context.PlatformSettings
            .OrderBy(s => s.Group)
            .ThenBy(s => s.SettingKey)
            .Select(s => new PlatformSettingDto
            {
                Id = s.Id,
                SettingKey = s.SettingKey,
                SettingValue = s.SettingValue,
                Group = s.Group,
                Description = s.Description,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();

        return ApiResponse<List<PlatformSettingDto>>.Success(settings);
    }

    public async Task<ApiResponse<PlatformSettingDto>> UpdateSettingAsync(
        UpdatePlatformSettingDto request, int adminUserId, string adminName)
    {
        var setting = await _context.PlatformSettings
            .FirstOrDefaultAsync(s => s.SettingKey == request.SettingKey);

        if (setting == null)
            return ApiResponse<PlatformSettingDto>.Fail("Setting key not found.", "NotFound");

        var oldVal = setting.SettingValue;
        setting.SettingValue = request.SettingValue;

        await AddAuditLogAsync("SettingChanged", "PlatformSetting", setting.SettingKey, adminUserId, adminName,
            $"Setting '{setting.SettingKey}' updated from '{oldVal}' to '{request.SettingValue}'.", "Warning");

        await _context.SaveChangesAsync();

        return ApiResponse<PlatformSettingDto>.Success(new PlatformSettingDto
        {
            Id = setting.Id,
            SettingKey = setting.SettingKey,
            SettingValue = setting.SettingValue,
            Group = setting.Group,
            Description = setting.Description,
            UpdatedAt = setting.UpdatedAt
        }, "Setting updated successfully.");
    }

    #endregion

    #region Audit Logs

    public async Task<ApiResponse<List<AuditLogDto>>> GetAuditLogsAsync(int count = 50)
    {
        var logs = await _context.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(count)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                Action = a.Action,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                PerformedByUserName = a.PerformedByUserName,
                Details = a.Details,
                Severity = a.Severity,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return ApiResponse<List<AuditLogDto>>.Success(logs);
    }

    #endregion

    #region Helper Methods

    private async Task AddAuditLogAsync(
        string action, string entityType, string entityId, int? userId, string userName, string details, string severity)
    {
        _context.AuditLogs.Add(new AuditLog
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            PerformedByUserId = userId,
            PerformedByUserName = userName,
            Details = details,
            Severity = severity,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await Task.CompletedTask;
    }

    private static VendorSummaryDto MapToVendorSummary(Vendor v)
    {
        return new VendorSummaryDto
        {
            Id = v.Id,
            UserId = v.UserId,
            StoreName = v.StoreName,
            OwnerName = v.OwnerName,
            PhoneNumber = v.PhoneNumber,
            SupportEmail = v.SupportEmail,
            City = v.City,
            State = v.State,
            BusinessRegistrationNumber = v.BusinessRegistrationNumber,
            Status = v.Status,
            CommissionRateOverride = v.CommissionRateOverride,
            TotalEarnings = v.TotalEarnings,
            TotalCommissionPaid = v.TotalCommissionPaid,
            TotalItemsCount = v.RentalItems?.Count ?? 0,
            ActiveBookingsCount = v.Bookings?.Count(b => b.Status == BookingStatus.Active || b.Status == BookingStatus.Delivered) ?? 0,
            CreatedAt = v.CreatedAt,
            ApprovedAt = v.ApprovedAt,
            RejectionReason = v.RejectionReason,
            AdminNotes = v.AdminNotes
        };
    }

    private static DisputeSummaryDto MapToDisputeSummary(Dispute d)
    {
        return new DisputeSummaryDto
        {
            Id = d.Id,
            DisputeTicketNumber = d.DisputeTicketNumber,
            BookingId = d.BookingId,
            BookingReference = d.Booking?.BookingReference ?? "N/A",
            ItemTitle = d.Booking?.Item?.Title ?? "N/A",
            CustomerName = d.RaisedByUser?.FullName ?? "N/A",
            VendorStoreName = d.Booking?.Vendor?.StoreName ?? "N/A",
            Reason = d.Reason,
            Status = d.Status,
            ClaimAmount = d.ClaimAmount,
            DepositHeld = d.Booking?.SecurityDeposit ?? 0.0m,
            Description = d.Description,
            CreatedAt = d.CreatedAt,
            ResolvedAt = d.ResolvedAt
        };
    }

    private static BookingSummaryDto MapToBookingSummary(Booking b)
    {
        return new BookingSummaryDto
        {
            Id = b.Id,
            BookingReference = b.BookingReference,
            CustomerId = b.CustomerId,
            CustomerName = b.Customer?.FullName ?? "N/A",
            CustomerEmail = b.Customer?.Email ?? "N/A",
            VendorId = b.VendorId,
            VendorStoreName = b.Vendor?.StoreName ?? "N/A",
            ItemId = b.ItemId,
            ItemTitle = b.Item?.Title ?? "N/A",
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
            DeliveryCity = b.DeliveryCity,
            CreatedAt = b.CreatedAt
        };
    }

    private static string GenerateSlug(string text)
    {
        return text.Trim().ToLower()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("/", "-")
            .Replace("'", "");
    }

    #endregion
}
