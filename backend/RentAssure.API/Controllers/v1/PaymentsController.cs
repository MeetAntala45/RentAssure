using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Interfaces;
using RentAssure.Application.Common.Models;
using RentAssure.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace RentAssure.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IStripePaymentService _paymentService;

    public PaymentsController(
        IApplicationDbContext context, 
        IConfiguration configuration,
        IStripePaymentService paymentService)
    {
        _context = context;
        _configuration = configuration;
        _paymentService = paymentService;
    }

    private int GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(idStr, out var id)) return id;
        throw new UnauthorizedAccessException("User is not authenticated.");
    }

    /// <summary>
    /// Creates a Stripe PaymentIntent for the checkout total (Security Deposit + 1st Month Rent).
    /// Tracks platform commission (for Admin) and merchant earnings (for Vendor).
    /// Returns the clientSecret so the frontend can confirm the payment via Stripe Elements.
    /// </summary>
    [HttpPost("create-intent")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
    {
        var item = await _context.RentalItems
            .Include(i => i.Category)
            .Include(i => i.Vendor)
            .FirstOrDefaultAsync(i => i.Id == request.ItemId);

        if (item == null)
        {
            return BadRequest(ApiResponse<object>.Fail("Rental item not found."));
        }

        if (item.Status == ItemStatus.Rented)
        {
            return BadRequest(ApiResponse<object>.Fail("This item is currently rented out."));
        }

        var rentalMonths = Math.Max(1, request.RentalMonths > 0 ? request.RentalMonths : item.MinimumRentalMonths);

        // Calculate discounted monthly rent based on tenure
        var monthlyRent = item.MonthlyRent;
        if (rentalMonths >= 12 && item.Discount12MonthsPercent > 0)
        {
            var discount = Math.Clamp(item.Discount12MonthsPercent, 0, 100);
            monthlyRent = Math.Round(item.MonthlyRent * (1m - (discount / 100m)), 2);
        }
        else if (rentalMonths >= 6 && item.Discount6MonthsPercent > 0)
        {
            var discount = Math.Clamp(item.Discount6MonthsPercent, 0, 100);
            monthlyRent = Math.Round(item.MonthlyRent * (1m - (discount / 100m)), 2);
        }

        var securityDeposit = item.SecurityDeposit;
        var totalAmount = securityDeposit + monthlyRent;

        // Platform commission rate (Admin fee)
        var commissionRate = 12.0m;
        if (item.Vendor?.CommissionRateOverride.HasValue == true)
        {
            commissionRate = item.Vendor.CommissionRateOverride.Value;
        }
        else if (item.Category != null && item.Category.CommissionRate > 0)
        {
            commissionRate = item.Category.CommissionRate;
        }

        var platformCommission = Math.Round(monthlyRent * (commissionRate / 100m), 2);
        var vendorPayout = monthlyRent - platformCommission;

        var userId = GetCurrentUserId();
        var customer = await _context.Users.FindAsync(userId);

        try
        {
            // Amount in paise (smallest currency unit for INR: 1 INR = 100 paise)
            var amountInPaise = (long)(totalAmount * 100);

            var options = new PaymentIntentCreateOptions
            {
                Amount = amountInPaise,
                Currency = "inr",
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                    AllowRedirects = "never",
                },
                Description = $"RentAssure: Rental reservation for '{item.Title}' ({rentalMonths} mos) — Dep: ₹{securityDeposit:N0} + 1st Mo: ₹{monthlyRent:N0}",
                Metadata = new Dictionary<string, string>
                {
                    { "itemId", request.ItemId.ToString() },
                    { "itemTitle", item.Title },
                    { "customerId", userId.ToString() },
                    { "customerEmail", customer?.Email ?? "" },
                    { "rentalMonths", rentalMonths.ToString() },
                    { "vendorId", item.VendorId.ToString() },
                    { "vendorStoreName", item.Vendor?.StoreName ?? "Merchant Partner" },
                    { "monthlyRent", monthlyRent.ToString("F2") },
                    { "securityDeposit", securityDeposit.ToString("F2") },
                    { "platformCommission", platformCommission.ToString("F2") },
                    { "vendorPayout", vendorPayout.ToString("F2") },
                    { "platform", "RentAssure" },
                },
                ReceiptEmail = customer?.Email,
            };

            var service = new PaymentIntentService();
            var intent = await service.CreateAsync(options);

            return Ok(ApiResponse<object>.Success(new
            {
                clientSecret = intent.ClientSecret,
                paymentIntentId = intent.Id,
                amount = totalAmount,
                monthlyRent,
                securityDeposit,
                platformCommission,
                vendorPayout,
                currency = "inr",
            }, "Payment intent created successfully."));
        }
        catch (StripeException ex)
        {
            return BadRequest(ApiResponse<object>.Fail($"Stripe error: {ex.Message}"));
        }
    }

    /// <summary>
    /// Confirm payment intent in test mode using Stripe's test payment method (pm_card_visa).
    /// Provides 100% reliable 1-click test card authorization in development environments.
    /// </summary>
    [HttpPost("test-confirm/{paymentIntentId}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TestConfirmPaymentIntent(string paymentIntentId)
    {
        try
        {
            var service = new PaymentIntentService();
            var options = new PaymentIntentConfirmOptions
            {
                PaymentMethod = "pm_card_visa",
            };
            var intent = await service.ConfirmAsync(paymentIntentId, options);

            return Ok(ApiResponse<object>.Success(new
            {
                paymentIntentId = intent.Id,
                status = intent.Status,
                amount = intent.Amount / 100m,
                currency = intent.Currency,
            }, "Payment confirmed successfully with Stripe test sandbox."));
        }
        catch (StripeException ex)
        {
            return BadRequest(ApiResponse<object>.Fail($"Stripe error: {ex.Message}"));
        }
    }

    /// <summary>
    /// Refund the security deposit back to the customer's card.
    /// Called when vendor approves deposit release on return completion.
    /// </summary>
    [HttpPost("refund-deposit/{bookingId:int}")]
    [Authorize(Roles = "Vendor,Admin")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefundDeposit(int bookingId)
    {
        var booking = await _context.Bookings
            .Include(b => b.Item)
            .Include(b => b.Customer)
            .Include(b => b.Vendor)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        if (booking == null)
        {
            return NotFound(ApiResponse<object>.Fail("Booking not found."));
        }

        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = GetCurrentUserId();

        if (role != "Admin")
        {
            var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.UserId == userId);
            if (vendor == null || booking.VendorId != vendor.Id)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("You are not authorized to release the deposit for this booking."));
            }
        }

        if (!booking.IsPaidOnline || string.IsNullOrEmpty(booking.StripePaymentIntentId))
        {
            return BadRequest(ApiResponse<object>.Fail("This booking was not paid online with Stripe. Cannot process card refund."));
        }

        if (booking.DepositStatus == DepositStatus.Refunded)
        {
            return BadRequest(ApiResponse<object>.Fail($"Deposit has already been refunded (Refund ID: {booking.StripeRefundId ?? "N/A"})."));
        }

        if (booking.SecurityDeposit <= 0)
        {
            return BadRequest(ApiResponse<object>.Fail("No security deposit amount recorded for this booking."));
        }

        var (success, refundId, errMsg) = await _paymentService.RefundDepositAsync(
            booking.StripePaymentIntentId,
            booking.SecurityDeposit,
            booking.Id,
            booking.BookingReference,
            booking.Customer?.Email);

        if (!success || string.IsNullOrEmpty(refundId))
        {
            return BadRequest(ApiResponse<object>.Fail($"Stripe refund failed: {errMsg}"));
        }

        // Update booking with refund tracking
        booking.StripeRefundId = refundId;
        booking.DepositStatus = DepositStatus.Refunded;
        booking.DepositRefundedAmount = booking.SecurityDeposit;

        // Audit log
        _context.AuditLogs.Add(new Domain.Entities.AuditLog
        {
            Action = "StripeDepositRefund",
            EntityType = "Booking",
            EntityId = booking.BookingReference,
            PerformedByUserId = userId,
            PerformedByUserName = role == "Admin" ? "Admin" : booking.Vendor?.StoreName ?? "Vendor",
            Details = $"Security deposit ₹{booking.SecurityDeposit:N2} refunded to customer via Stripe. Refund ID: {refundId}",
            Severity = "Info"
        });

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new
        {
            refundId,
            bookingId = booking.Id,
            bookingReference = booking.BookingReference,
            refundedAmount = booking.SecurityDeposit,
            customerEmail = booking.Customer?.Email,
        }, $"Security deposit of ₹{booking.SecurityDeposit:N2} has been successfully refunded to the customer's card."));
    }

    /// <summary>
    /// Get the Stripe publishable key for the frontend.
    /// </summary>
    [HttpGet("config")]
    public IActionResult GetStripeConfig()
    {
        var publishableKey = _configuration["Stripe:PublishableKey"]
            ?? Environment.GetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY")
            ?? Environment.GetEnvironmentVariable("Stripe__PublishableKey");
        return Ok(ApiResponse<object>.Success(new { publishableKey }, "Stripe config retrieved."));
    }
}

public class CreatePaymentIntentRequest
{
    public int ItemId { get; set; }
    public decimal Amount { get; set; }
    public int RentalMonths { get; set; } = 3;
}
