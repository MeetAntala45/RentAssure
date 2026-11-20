using RentAssure.Domain.Common;

namespace RentAssure.Domain.Entities;

public class RentalReview : BaseEntity
{
    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    public int ItemId { get; set; }
    public RentalItem Item { get; set; } = null!;

    public int CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    public int Rating { get; set; } // 1 to 5 stars
    public string? Comment { get; set; }
}
