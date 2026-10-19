using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Bookings.DTOs;
using RentAssure.Application.Features.Bookings.Services;

namespace RentAssure.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    private int GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(idStr, out var id)) return id;
        // Fallback for seamless demo/customer session if not authenticated
        return 1;
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await _bookingService.CreateBookingAsync(userId, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpGet("my")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<BookingDetailDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = GetCurrentUserId();
        var result = await _bookingService.GetCustomerBookingsAsync(userId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBookingById(int id)
    {
        var userId = GetCurrentUserId();
        var result = await _bookingService.GetBookingByIdAsync(id, userId);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost("{id:int}/return")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RequestReturn(int id, [FromBody] RequestReturnDto request)
    {
        var userId = GetCurrentUserId();
        var result = await _bookingService.RequestReturnAsync(id, userId, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("{id:int}/dispute")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RaiseDispute(int id, [FromBody] RaiseCustomerDisputeDto request)
    {
        var userId = GetCurrentUserId();
        var result = await _bookingService.RaiseDisputeAsync(id, userId, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
