using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Items.DTOs;
using RentAssure.Application.Features.Items.Services;

namespace RentAssure.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IItemService _itemService;

    public CategoriesController(IItemService itemService)
    {
        _itemService = itemService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<List<MarketplaceCategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _itemService.GetCategoriesAsync();
        return Ok(result);
    }
}
