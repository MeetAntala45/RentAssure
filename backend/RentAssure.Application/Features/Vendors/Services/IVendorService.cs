using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Bookings.DTOs;
using RentAssure.Application.Features.Items.DTOs;
using RentAssure.Application.Features.Vendors.DTOs;

namespace RentAssure.Application.Features.Vendors.Services;

public interface IVendorService
{
    Task<ApiResponse<VendorStatusDto>> GetVendorStatusAsync(int userId);
    Task<ApiResponse<VendorStatusDto>> SubmitVendorOnboardingAsync(int userId, VendorOnboardingRequestDto request);
    Task<ApiResponse<VendorDashboardMetricsDto>> GetVendorDashboardAsync(int userId);
    Task<ApiResponse<List<VendorItemListingDto>>> GetVendorInventoryAsync(int userId);
    Task<ApiResponse<VendorItemListingDto>> CreateRentalItemAsync(int userId, CreateRentalItemDto request);
    Task<ApiResponse<VendorItemListingDto>> UpdateRentalItemAsync(int userId, int itemId, UpdateRentalItemDto request);
    Task<ApiResponse<bool>> DeleteRentalItemAsync(int userId, int itemId);
    Task<ApiResponse<List<BookingDetailDto>>> GetVendorBookingsAsync(int userId);
    Task<ApiResponse<BookingDetailDto>> GetVendorBookingByIdAsync(int userId, int bookingId);
    Task<ApiResponse<BookingDetailDto>> UpdateBookingStatusAsync(int userId, int bookingId, UpdateVendorOrderStatusDto request);
    Task<ApiResponse<VendorEarningsSummaryDto>> GetVendorEarningsAsync(int userId);
    Task<ApiResponse<VendorProfileUpdateDto>> UpdateVendorProfileAsync(int userId, VendorProfileUpdateDto request);
}
