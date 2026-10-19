using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Bookings.DTOs;
using RentAssure.Application.Features.Items.DTOs;
using RentAssure.Application.Features.Vendors.DTOs;
using RentAssure.Application.Features.Vendors.Services;

namespace RentAssure.API.Controllers.v1;

[ApiController]
[Route("api/v1/vendor")]
public class VendorPortalController : ControllerBase
{
    private readonly IVendorService _vendorService;

    public VendorPortalController(IVendorService vendorService)
    {
        _vendorService = vendorService;
    }

    private int GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(idStr, out var id)) return id;
        return 1;
    }

    [HttpGet("status")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<VendorStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus()
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.GetVendorStatusAsync(userId);
        return Ok(result);
    }

    [HttpPost("onboarding")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<VendorStatusDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<VendorStatusDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitOnboarding([FromBody] VendorOnboardingRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.SubmitVendorOnboardingAsync(userId, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("dashboard")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<VendorDashboardMetricsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.GetVendorDashboardAsync(userId);
        return Ok(result);
    }

    [HttpGet("inventory")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<VendorItemListingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventory()
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.GetVendorInventoryAsync(userId);
        return Ok(result);
    }

    [HttpPost("items")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<VendorItemListingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<VendorItemListingDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateItem([FromBody] CreateRentalItemDto request)
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.CreateRentalItemAsync(userId, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPut("items/{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<VendorItemListingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<VendorItemListingDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] UpdateRentalItemDto request)
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.UpdateRentalItemAsync(userId, id, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpDelete("items/{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.DeleteRentalItemAsync(userId, id);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("bookings")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<BookingDetailDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVendorBookings()
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.GetVendorBookingsAsync(userId);
        return Ok(result);
    }

    [HttpPut("bookings/{id:int}/status")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateVendorOrderStatusDto request)
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.UpdateBookingStatusAsync(userId, id, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<VendorProfileUpdateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<VendorProfileUpdateDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] VendorProfileUpdateDto request)
    {
        var userId = GetCurrentUserId();
        var result = await _vendorService.UpdateVendorProfileAsync(userId, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
