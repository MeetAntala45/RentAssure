namespace RentAssure.Application.Common.Interfaces;

public interface IStripePaymentService
{
    Task<(bool Success, string? RefundId, string? ErrorMessage)> RefundDepositAsync(
        string paymentIntentId,
        decimal amount,
        int bookingId,
        string bookingRef,
        string? customerEmail);
}
