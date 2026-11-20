namespace RentAssure.Application.Features.Bookings.DTOs;

public class CreateOrUpdateReviewDto
{
    public int BookingId { get; set; }
    public int Rating { get; set; } // 1 to 5
    public string? Comment { get; set; }
}

public class ReviewDto
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public int ItemId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
