using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Application.Features.Admin.Services;

namespace RentAssure.API.Controllers.v1.Admin;

[ApiController]
[Route("api/admin/settings")]
[Authorize(Roles = "Admin")]
public class AdminSettingsController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminSettingsController(IAdminService adminService)
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
    public async Task<ActionResult<ApiResponse<List<PlatformSettingDto>>>> GetSettings()
    {
        var result = await _adminService.GetSettingsAsync();
        return Ok(result);
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<PlatformSettingDto>>> UpdateSetting(
        [FromBody] UpdatePlatformSettingDto request)
    {
        var result = await _adminService.UpdateSettingAsync(request, GetAdminUserId(), GetAdminName());
        if (!result.IsSuccess)
            return BadRequest(result);

        return Ok(result);
    }
}
