using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Admin.DTOs;
using RentAssure.Application.Features.Admin.Services;

namespace RentAssure.API.Controllers.v1.Admin;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin")]
public class AdminCategoriesController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminCategoriesController(IAdminService adminService)
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
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetCategories()
    {
        var result = await _adminService.GetCategoriesAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory(
        [FromBody] CreateOrUpdateCategoryDto request)
    {
        var result = await _adminService.CreateCategoryAsync(request, GetAdminUserId(), GetAdminName());
        return CreatedAtAction(nameof(GetCategories), result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(
        [FromRoute] int id,
        [FromBody] CreateOrUpdateCategoryDto request)
    {
        var result = await _adminService.UpdateCategoryAsync(id, request, GetAdminUserId(), GetAdminName());
        if (!result.IsSuccess)
            return NotFound(result);

        return Ok(result);
    }

    [HttpPatch("{id:int}/toggle-status")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleStatus([FromRoute] int id)
    {
        var result = await _adminService.ToggleCategoryStatusAsync(id, GetAdminUserId(), GetAdminName());
        if (!result.IsSuccess)
            return NotFound(result);

        return Ok(result);
    }
}
