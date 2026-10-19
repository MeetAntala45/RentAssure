using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentAssure.Application.Common.Interfaces;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Items.DTOs;
using RentAssure.Domain.Entities;
using RentAssure.Domain.Enums;

namespace RentAssure.Application.Features.Items.Services;

public class ItemService : IItemService
{
    private readonly IApplicationDbContext _context;

    public ItemService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<RentalItemDto>>> GetCatalogItemsAsync(ItemFilterDto filter)
    {
        var query = _context.RentalItems
            .AsNoTracking()
            .Include(i => i.Category)
            .Include(i => i.Vendor)
            .Where(i => i.Status != ItemStatus.Inactive && i.Vendor.Status == VendorStatus.Approved);

        // Search term
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(i =>
                i.Title.ToLower().Contains(search) ||
                i.Description.ToLower().Contains(search) ||
                (i.Brand != null && i.Brand.ToLower().Contains(search)) ||
                (i.Model != null && i.Model.ToLower().Contains(search)));
        }

        // Category
        if (filter.CategoryId.HasValue)
        {
            query = query.Where(i => i.CategoryId == filter.CategoryId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(filter.CategorySlug))
        {
            query = query.Where(i => i.Category.Slug.ToLower() == filter.CategorySlug.ToLower());
        }

        // City
        if (!string.IsNullOrWhiteSpace(filter.City) && filter.City != "All")
        {
            query = query.Where(i => i.City.ToLower() == filter.City.ToLower());
        }

        // Min & Max Price
        if (filter.MinPrice.HasValue)
        {
            query = query.Where(i => i.MonthlyRent >= filter.MinPrice.Value);
        }
        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(i => i.MonthlyRent <= filter.MaxPrice.Value);
        }

        // Minimum Months
        if (filter.MinimumMonths.HasValue)
        {
            query = query.Where(i => i.MinimumRentalMonths <= filter.MinimumMonths.Value);
        }

        // Condition
        if (!string.IsNullOrWhiteSpace(filter.Condition) && filter.Condition != "All")
        {
            query = query.Where(i => i.Condition.ToLower() == filter.Condition.ToLower());
        }

        // Sorting
        query = filter.SortBy switch
        {
            "price_asc" => query.OrderBy(i => i.MonthlyRent),
            "price_desc" => query.OrderByDescending(i => i.MonthlyRent),
            "popular" => query.OrderByDescending(i => i.TotalRentalsCount),
            _ => query.OrderByDescending(i => i.CreatedAt)
        };

        var totalCount = await query.CountAsync();
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 12 : filter.PageSize;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtoList = items.Select(MapToDto).ToList();

        return ApiResponse<PagedResult<RentalItemDto>>.Success(new PagedResult<RentalItemDto>
        {
            Items = dtoList,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ApiResponse<RentalItemDto>> GetItemByIdAsync(int id)
    {
        var item = await _context.RentalItems
            .AsNoTracking()
            .Include(i => i.Category)
            .Include(i => i.Vendor)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (item == null)
        {
            return ApiResponse<RentalItemDto>.Fail("Rental item not found.");
        }

        return ApiResponse<RentalItemDto>.Success(MapToDto(item));
    }

    public async Task<ApiResponse<List<MarketplaceCategoryDto>>> GetCategoriesAsync()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .Select(c => new MarketplaceCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description ?? "",
                Icon = c.Icon ?? "",
                CommissionRate = c.CommissionRate,
                AvailableItemsCount = c.RentalItems.Count(i => i.Status == ItemStatus.Available)
            })
            .ToListAsync();

        return ApiResponse<List<MarketplaceCategoryDto>>.Success(categories);
    }

    public async Task<ApiResponse<List<string>>> GetAvailableCitiesAsync()
    {
        var cities = await _context.RentalItems
            .AsNoTracking()
            .Where(i => i.Status != ItemStatus.Inactive && !string.IsNullOrWhiteSpace(i.City))
            .Select(i => i.City)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return ApiResponse<List<string>>.Success(cities);
    }

    private static RentalItemDto MapToDto(RentalItem item)
    {
        List<string> images = new();
        try
        {
            if (!string.IsNullOrWhiteSpace(item.ImagesJson))
            {
                images = JsonSerializer.Deserialize<List<string>>(item.ImagesJson) ?? new();
            }
        }
        catch
        {
            images = new List<string>();
        }

        return new RentalItemDto
        {
            Id = item.Id,
            VendorId = item.VendorId,
            VendorStoreName = item.Vendor?.StoreName ?? "Verified Partner Store",
            VendorOwnerName = item.Vendor?.OwnerName ?? "Store Manager",
            VendorCity = item.Vendor?.City ?? item.City,
            VendorRating = 4.9m,
            CategoryId = item.CategoryId,
            CategoryName = item.Category?.Name ?? "General",
            CategorySlug = item.Category?.Slug ?? "general",
            Title = item.Title,
            Description = item.Description,
            Brand = item.Brand,
            Model = item.Model,
            Condition = item.Condition,
            MonthlyRent = item.MonthlyRent,
            SecurityDeposit = item.SecurityDeposit,
            MinimumRentalMonths = item.MinimumRentalMonths,
            Images = images,
            Status = item.Status,
            City = item.City,
            Area = item.Area,
            TotalRentalsCount = item.TotalRentalsCount,
            CreatedAt = item.CreatedAt
        };
    }
}
