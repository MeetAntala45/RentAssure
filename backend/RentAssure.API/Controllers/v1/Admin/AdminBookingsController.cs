using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Application.Features.Admin.Services;
using RentAssure.Domain.Enums;

namespace RentAssure.API.Controllers.v1.Admin;

[ApiController]
[Route("api/admin/bookings")]
[Authorize(Roles = "Admin")]
public class AdminBookingsController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminBookingsController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<BookingSummaryDto>>>> GetBookings(
        [FromQuery] BookingStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _adminService.GetBookingsAsync(status, search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<BookingSummaryDto>>> GetBookingById([FromRoute] int id)
    {
        var result = await _adminService.GetBookingByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);

        return Ok(result);
    }
}
