using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Items.DTOs;

namespace RentAssure.Application.Features.Items.Services;

public interface IItemService
{
    Task<ApiResponse<PagedResult<RentalItemDto>>> GetCatalogItemsAsync(ItemFilterDto filter);
    Task<ApiResponse<RentalItemDto>> GetItemByIdAsync(int id);
    Task<ApiResponse<List<MarketplaceCategoryDto>>> GetCategoriesAsync();
    Task<ApiResponse<List<string>>> GetAvailableCitiesAsync();
}
