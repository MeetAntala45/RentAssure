using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Domain.Enums;

namespace RentAssure.Application.Features.Admin.Services;

public interface IAdminService
{
    // Dashboard & Metrics
    Task<ApiResponse<AdminDashboardStatsDto>> GetDashboardStatsAsync();

    // Vendor Operations
    Task<ApiResponse<PagedResult<VendorSummaryDto>>> GetVendorsAsync(
        VendorStatus? status, string? search, int page = 1, int pageSize = 10);
    Task<ApiResponse<VendorDetailDto>> GetVendorByIdAsync(int vendorId);
    Task<ApiResponse<VendorSummaryDto>> ApproveVendorAsync(
        int vendorId, VendorApprovalRequestDto request, int adminUserId, string adminName);
    Task<ApiResponse<VendorSummaryDto>> RejectVendorAsync(
        int vendorId, VendorRejectionRequestDto request, int adminUserId, string adminName);
    Task<ApiResponse<VendorSummaryDto>> SuspendVendorAsync(
        int vendorId, VendorSuspensionRequestDto request, int adminUserId, string adminName);
    Task<ApiResponse<VendorSummaryDto>> UpdateVendorCommissionAsync(
        int vendorId, VendorCommissionUpdateRequestDto request, int adminUserId, string adminName);

    // Dispute Resolution
    Task<ApiResponse<PagedResult<DisputeSummaryDto>>> GetDisputesAsync(
        DisputeStatus? status, string? search, int page = 1, int pageSize = 10);
    Task<ApiResponse<DisputeDetailDto>> GetDisputeByIdAsync(int disputeId);
    Task<ApiResponse<DisputeDetailDto>> ResolveDisputeAsync(
        int disputeId, ResolveDisputeRequestDto request, int adminUserId, string adminName);

    // Bookings & Escrow Oversight
    Task<ApiResponse<PagedResult<BookingSummaryDto>>> GetBookingsAsync(
        BookingStatus? status, string? search, int page = 1, int pageSize = 10);
    Task<ApiResponse<BookingSummaryDto>> GetBookingByIdAsync(int bookingId);

    // Category Management
    Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync();
    Task<ApiResponse<CategoryDto>> CreateCategoryAsync(
        CreateOrUpdateCategoryDto request, int adminUserId, string adminName);
    Task<ApiResponse<CategoryDto>> UpdateCategoryAsync(
        int id, CreateOrUpdateCategoryDto request, int adminUserId, string adminName);
    Task<ApiResponse<bool>> ToggleCategoryStatusAsync(
        int id, int adminUserId, string adminName);

    // Platform Settings & Commission Rules
    Task<ApiResponse<List<PlatformSettingDto>>> GetSettingsAsync();
    Task<ApiResponse<PlatformSettingDto>> UpdateSettingAsync(
        UpdatePlatformSettingDto request, int adminUserId, string adminName);

    // Audit Trail
    Task<ApiResponse<List<AuditLogDto>>> GetAuditLogsAsync(int count = 50);
}
