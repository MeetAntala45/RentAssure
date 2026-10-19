using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Application.Features.Admin.Services;
using RentAssure.Domain.Enums;

namespace RentAssure.API.Controllers.v1.Admin;

[ApiController]
[Route("api/admin/vendors")]
[Authorize(Roles = "Admin")]
public class AdminVendorsController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminVendorsController(IAdminService adminService)
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
    public async Task<ActionResult<ApiResponse<PagedResult<VendorSummaryDto>>>> GetVendors(
        [FromQuery] VendorStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _adminService.GetVendorsAsync(status, search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<VendorDetailDto>>> GetVendorById([FromRoute] int id)
    {
        var result = await _adminService.GetVendorByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);

        return Ok(result);
    }

    [HttpPost("{id:int}/approve")]
    public async Task<ActionResult<ApiResponse<VendorSummaryDto>>> ApproveVendor(
        [FromRoute] int id,
        [FromBody] VendorApprovalRequestDto request)
    {
        var result = await _adminService.ApproveVendorAsync(id, request, GetAdminUserId(), GetAdminName());
        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{id:int}/reject")]
    public async Task<ActionResult<ApiResponse<VendorSummaryDto>>> RejectVendor(
        [FromRoute] int id,
        [FromBody] VendorRejectionRequestDto request)
    {
        var result = await _adminService.RejectVendorAsync(id, request, GetAdminUserId(), GetAdminName());
        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{id:int}/suspend")]
    public async Task<ActionResult<ApiResponse<VendorSummaryDto>>> SuspendVendor(
        [FromRoute] int id,
        [FromBody] VendorSuspensionRequestDto request)
    {
        var result = await _adminService.SuspendVendorAsync(id, request, GetAdminUserId(), GetAdminName());
        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPut("{id:int}/commission")]
    public async Task<ActionResult<ApiResponse<VendorSummaryDto>>> UpdateCommission(
        [FromRoute] int id,
        [FromBody] VendorCommissionUpdateRequestDto request)
    {
        var result = await _adminService.UpdateVendorCommissionAsync(id, request, GetAdminUserId(), GetAdminName());
        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }
}
