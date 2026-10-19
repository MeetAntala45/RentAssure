using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Application.Features.Admin.Services;
using RentAssure.Domain.Enums;

namespace RentAssure.API.Controllers.v1.Admin;

[ApiController]
[Route("api/admin/disputes")]
[Authorize(Roles = "Admin")]
public class AdminDisputesController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminDisputesController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private int GetAdminUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(idStr, out var id)) return id;
        return 1;
    }
    private string GetAdminName() => User.FindFirstValue("fullName") ?? User.FindFirstValue(ClaimTypes.Email) ?? "Admin";

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<DisputeSummaryDto>>>> GetDisputes(
        [FromQuery] DisputeStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _adminService.GetDisputesAsync(status, search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<DisputeDetailDto>>> GetDisputeById([FromRoute] int id)
    {
        var result = await _adminService.GetDisputeByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);

        return Ok(result);
    }

    [HttpPost("{id:int}/resolve")]
    public async Task<ActionResult<ApiResponse<DisputeDetailDto>>> ResolveDispute(
        [FromRoute] int id,
        [FromBody] ResolveDisputeRequestDto request)
    {
        var result = await _adminService.ResolveDisputeAsync(id, request, GetAdminUserId(), GetAdminName());
        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }
}
