using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentAssure.Application.Common.Interfaces;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Bookings.DTOs;
using RentAssure.Domain.Entities;
using RentAssure.Domain.Enums;

namespace RentAssure.Application.Features.Bookings.Services;

public class BookingService : IBookingService
{
    private readonly IApplicationDbContext _context;

    public BookingService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<BookingDetailDto>> CreateBookingAsync(int customerId, CreateBookingRequestDto request)
    {
        if (request.RentalDurationMonths < 1)
        {
            return ApiResponse<BookingDetailDto>.Fail("Rental duration must be at least 1 month.");
        }

        var item = await _context.RentalItems
            .Include(i => i.Category)
            .Include(i => i.Vendor)
            .FirstOrDefaultAsync(i => i.Id == request.ItemId);

        if (item == null)
        {
            return ApiResponse<BookingDetailDto>.Fail("Rental item not found.");
        }

        if (item.Status == ItemStatus.Inactive)
        {
            return ApiResponse<BookingDetailDto>.Fail("This item is currently inactive.");
        }

        if (request.RentalDurationMonths < item.MinimumRentalMonths)
        {
            return ApiResponse<BookingDetailDto>.Fail($"Minimum rental tenure for this item is {item.MinimumRentalMonths} months.");
        }

        var customer = await _context.Users.FindAsync(customerId);
        if (customer == null)
        {
            return ApiResponse<BookingDetailDto>.Fail("Customer account not found.");
        }

        // Calculate discounted monthly rent based on tenure
        var monthlyRent = item.MonthlyRent;
        if (request.RentalDurationMonths >= 12)
        {
            monthlyRent = Math.Round(item.MonthlyRent * 0.80m, 2); // 20% discount
        }
        else if (request.RentalDurationMonths >= 6)
        {
            monthlyRent = Math.Round(item.MonthlyRent * 0.90m, 2); // 10% discount
        }

        var securityDeposit = item.SecurityDeposit;
        var totalAmountPaid = securityDeposit + monthlyRent; // Initial checkout charge (deposit + first month)

        var commissionRate = 12.0m;
        if (item.Vendor?.CommissionRateOverride.HasValue == true)
        {
            commissionRate = item.Vendor.CommissionRateOverride.Value;
        }
        else if (item.Category != null && item.Category.CommissionRate > 0)
        {
            commissionRate = item.Category.CommissionRate;
        }

        var platformCommission = Math.Round(monthlyRent * (commissionRate / 100m), 2);
        var vendorPayout = monthlyRent - platformCommission;

        var startDate = request.StartDate ?? DateTime.UtcNow;
        var endDate = startDate.AddMonths(request.RentalDurationMonths);
        var bookingRef = $"RA-BK-{DateTime.UtcNow:yyyyMM}-{Random.Shared.Next(1000, 9999)}";

        var booking = new Booking
        {
            BookingReference = bookingRef,
            CustomerId = customerId,
            VendorId = item.VendorId,
            ItemId = item.Id,
            StartDate = startDate,
            EndDate = endDate,
            RentalDurationMonths = request.RentalDurationMonths,
            MonthlyRent = monthlyRent,
            SecurityDeposit = securityDeposit,
            TotalAmountPaid = totalAmountPaid,
            CommissionRateApplied = commissionRate,
            PlatformCommissionAmount = platformCommission,
            VendorPayoutAmount = vendorPayout,
            Status = BookingStatus.Active,
            DepositStatus = DepositStatus.Held,
            DeliveryAddress = string.IsNullOrWhiteSpace(request.DeliveryAddress) ? "Default Customer Address" : request.DeliveryAddress.Trim(),
            DeliveryCity = string.IsNullOrWhiteSpace(request.DeliveryCity) ? item.City : request.DeliveryCity.Trim()
        };

        item.Status = ItemStatus.Rented;
        item.TotalRentalsCount++;

        if (item.Vendor != null)
        {
            item.Vendor.TotalEarnings += vendorPayout;
            item.Vendor.TotalCommissionPaid += platformCommission;
        }

        _context.Bookings.Add(booking);

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "CreateRentalBooking",
            EntityType = "Booking",
            EntityId = bookingRef,
            PerformedByUserId = customerId,
            PerformedByUserName = customer.FullName,
            Details = $"Customer created {request.RentalDurationMonths}-month rental for '{item.Title}' from vendor '{item.Vendor?.StoreName ?? "Merchant Partner"}'.",
            Severity = "Info"
        });

        await _context.SaveChangesAsync();

        return ApiResponse<BookingDetailDto>.Success(MapToDto(booking, item, customer, item.Vendor), "Rental booking created successfully!");
    }

    public async Task<ApiResponse<List<BookingDetailDto>>> GetCustomerBookingsAsync(int customerId)
    {
        var bookings = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.Item)
            .Include(b => b.Vendor)
            .Include(b => b.Customer)
            .Where(b => b.CustomerId == customerId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var dtoList = bookings.Select(b => MapToDto(b, b.Item, b.Customer, b.Vendor)).ToList();
        return ApiResponse<List<BookingDetailDto>>.Success(dtoList);
    }

    public async Task<ApiResponse<BookingDetailDto>> GetBookingByIdAsync(int bookingId, int customerId)
    {
        var booking = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.Item)
            .Include(b => b.Vendor)
            .Include(b => b.Customer)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.CustomerId == customerId);

        if (booking == null)
        {
            return ApiResponse<BookingDetailDto>.Fail("Booking not found.");
        }

        return ApiResponse<BookingDetailDto>.Success(MapToDto(booking, booking.Item, booking.Customer, booking.Vendor));
    }

    public async Task<ApiResponse<BookingDetailDto>> RequestReturnAsync(int bookingId, int customerId, RequestReturnDto request)
    {
        var booking = await _context.Bookings
            .Include(b => b.Item)
            .Include(b => b.Vendor)
            .Include(b => b.Customer)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.CustomerId == customerId);

        if (booking == null)
        {
            return ApiResponse<BookingDetailDto>.Fail("Booking not found.");
        }

        if (booking.Status != BookingStatus.Active && booking.Status != BookingStatus.Delivered)
        {
            return ApiResponse<BookingDetailDto>.Fail("Only active rentals can be scheduled for return.");
        }

        booking.Status = BookingStatus.ReturnRequested;
        booking.VendorNotes = string.IsNullOrWhiteSpace(request.Reason)
            ? $"Return requested by customer. Pickup preferred by {request.PreferredPickupDate:MMM dd, yyyy}."
            : $"Return requested: {request.Reason} (Preferred: {request.PreferredPickupDate:MMM dd, yyyy})";

        await _context.SaveChangesAsync();

        return ApiResponse<BookingDetailDto>.Success(MapToDto(booking, booking.Item, booking.Customer, booking.Vendor), "Pickup and return request submitted to vendor.");
    }

    public async Task<ApiResponse<bool>> RaiseDisputeAsync(int bookingId, int customerId, RaiseCustomerDisputeDto request)
    {
        var booking = await _context.Bookings
            .Include(b => b.Item)
            .Include(b => b.Vendor)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.CustomerId == customerId);

        if (booking == null)
        {
            return ApiResponse<bool>.Fail("Booking not found.");
        }

        var customer = await _context.Users.FindAsync(customerId);

        var dispute = new Dispute
        {
            DisputeTicketNumber = $"RA-DSP-{DateTime.UtcNow:yyyyMM}-{Random.Shared.Next(1000, 9999)}",
            BookingId = booking.Id,
            RaisedByUserId = customerId,
            Reason = request.Reason,
            Description = request.Description,
            ClaimAmount = request.ClaimedAmount > 0 ? request.ClaimedAmount : booking.SecurityDeposit,
            Status = DisputeStatus.Open
        };

        _context.Disputes.Add(dispute);

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "CustomerRaisedDispute",
            EntityType = "Dispute",
            EntityId = booking.BookingReference,
            PerformedByUserId = customerId,
            PerformedByUserName = customer?.FullName ?? "Customer",
            Details = $"Dispute filed for reason {request.Reason}. Amount: {request.ClaimedAmount:C}",
            Severity = "Warning"
        });

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Success(true, "Dispute filed successfully. RentAssure trust & safety team has been notified.");
    }

    private static BookingDetailDto MapToDto(Booking b, RentalItem? item, User? customer, Vendor? vendor)
    {
        string imageUrl = "";
        try
        {
            if (item != null && !string.IsNullOrWhiteSpace(item.ImagesJson))
            {
                var list = JsonSerializer.Deserialize<List<string>>(item.ImagesJson);
                imageUrl = list?.FirstOrDefault() ?? "";
            }
        }
        catch { }

        return new BookingDetailDto
        {
            Id = b.Id,
            BookingReference = b.BookingReference,
            CustomerId = b.CustomerId,
            CustomerName = customer?.FullName ?? "Customer",
            CustomerEmail = customer?.Email ?? "",
            CustomerPhone = customer?.PhoneNumber,
            VendorId = b.VendorId,
            VendorStoreName = vendor?.StoreName ?? "Partner Store",
            VendorCity = vendor?.City ?? b.DeliveryCity,
            ItemId = b.ItemId,
            ItemTitle = item?.Title ?? "Rental Item",
            ItemImageUrl = imageUrl,
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
    }
}
