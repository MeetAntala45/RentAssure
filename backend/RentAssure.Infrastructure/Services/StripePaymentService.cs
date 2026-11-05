using RentAssure.Application.Common.Interfaces;
using Stripe;

namespace RentAssure.Infrastructure.Services;

public class StripePaymentService : IStripePaymentService
{
    public async Task<(bool Success, string? RefundId, string? ErrorMessage)> RefundDepositAsync(
        string paymentIntentId,
        decimal amount,
        int bookingId,
        string bookingRef,
        string? customerEmail)
    {
        try
        {
            var refundAmountInPaise = (long)(amount * 100);
            var refundOptions = new RefundCreateOptions
            {
                PaymentIntent = paymentIntentId,
                Amount = refundAmountInPaise,
                Reason = "requested_by_customer",
                Metadata = new Dictionary<string, string>
                {
                    { "bookingId", bookingId.ToString() },
                    { "bookingReference", bookingRef },
                    { "refundType", "SecurityDepositReturn" },
                    { "customerEmail", customerEmail ?? "" },
                    { "platform", "RentAssure" }
                }
            };

            var service = new RefundService();
            var refund = await service.CreateAsync(refundOptions);
            return (true, refund.Id, null);
        }
        catch (StripeException ex)
        {
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, null, ex.Message);
        }
    }
}
