using RentAssure.Domain.Enums;

namespace RentAssure.Application.Features.Items.DTOs;

public class RentalItemDto
{
    public int Id { get; set; }
    public int VendorId { get; set; }
    public string VendorStoreName { get; set; } = string.Empty;
    public string VendorOwnerName { get; set; } = string.Empty;
    public string VendorCity { get; set; } = string.Empty;
    public decimal VendorRating { get; set; } = 4.9m;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string Condition { get; set; } = "Brand New";
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public int MinimumRentalMonths { get; set; }
    public List<string> Images { get; set; } = new();
    public ItemStatus Status { get; set; }
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public int TotalRentalsCount { get; set; }
    public DateTime CreatedAt { get; set; }

    // Calculated pricing for 3, 6, 12 month subscriptions
    public decimal Rent3Months => MonthlyRent;
    public decimal Rent6Months => Math.Round(MonthlyRent * 0.90m, 2); // 10% discount
    public decimal Rent12Months => Math.Round(MonthlyRent * 0.80m, 2); // 20% discount
}

public class ItemFilterDto
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public string? CategorySlug { get; set; }
    public string? City { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? MinimumMonths { get; set; }
    public string? Condition { get; set; }
    public string? SortBy { get; set; } // price_asc, price_desc, popular, newest
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class CreateRentalItemDto
{
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string Condition { get; set; } = "Brand New";
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public int MinimumRentalMonths { get; set; } = 3;
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public List<string> Images { get; set; } = new();
}

public class UpdateRentalItemDto
{
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string Condition { get; set; } = "Brand New";
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public int MinimumRentalMonths { get; set; } = 3;
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public List<string> Images { get; set; } = new();
    public ItemStatus Status { get; set; } = ItemStatus.Available;
}

public class MarketplaceCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public decimal CommissionRate { get; set; }
    public int AvailableItemsCount { get; set; }
}
