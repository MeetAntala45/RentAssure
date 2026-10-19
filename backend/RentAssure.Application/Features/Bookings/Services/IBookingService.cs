using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Bookings.DTOs;

namespace RentAssure.Application.Features.Bookings.Services;

public interface IBookingService
{
    Task<ApiResponse<BookingDetailDto>> CreateBookingAsync(int customerId, CreateBookingRequestDto request);
    Task<ApiResponse<List<BookingDetailDto>>> GetCustomerBookingsAsync(int customerId);
    Task<ApiResponse<BookingDetailDto>> GetBookingByIdAsync(int bookingId, int customerId);
    Task<ApiResponse<BookingDetailDto>> RequestReturnAsync(int bookingId, int customerId, RequestReturnDto request);
    Task<ApiResponse<bool>> RaiseDisputeAsync(int bookingId, int customerId, RaiseCustomerDisputeDto request);
}
