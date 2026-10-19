using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Application.Features.Admin.Services;

namespace RentAssure.API.Controllers.v1.Admin;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminDashboardController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<AdminDashboardStatsDto>>> GetStats()
    {
        var result = await _adminService.GetDashboardStatsAsync();
        return Ok(result);
    }

    [HttpGet("audits")]
    public async Task<ActionResult<ApiResponse<List<AuditLogDto>>>> GetAudits([FromQuery] int count = 50)
    {
        var result = await _adminService.GetAuditLogsAsync(count);
        return Ok(result);
    }
}
