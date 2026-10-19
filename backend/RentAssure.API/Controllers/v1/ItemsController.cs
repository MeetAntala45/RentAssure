using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Items.DTOs;
using RentAssure.Application.Features.Items.Services;

namespace RentAssure.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly IItemService _itemService;

    public ItemsController(IItemService itemService)
    {
        _itemService = itemService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<RentalItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCatalogItems([FromQuery] ItemFilterDto filter)
    {
        var result = await _itemService.GetCatalogItemsAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<RentalItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<RentalItemDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetItemById(int id)
    {
        var result = await _itemService.GetItemByIdAsync(id);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpGet("categories")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<List<MarketplaceCategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _itemService.GetCategoriesAsync();
        return Ok(result);
    }

    [HttpGet("cities")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<List<string>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableCities()
    {
        var result = await _itemService.GetAvailableCitiesAsync();
        return Ok(result);
    }
}
