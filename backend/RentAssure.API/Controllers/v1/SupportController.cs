using Microsoft.AspNetCore.Mvc;
using RentAssure.Application.Common.Interfaces;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Support.DTOs;
using RentAssure.Domain.Entities;

namespace RentAssure.API.Controllers.v1;

[ApiController]
[Route("api/v1/support")]
public class SupportController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public SupportController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> CreateSupportTicket([FromBody] CreateSupportTicketDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<SupportTicketDto>.Fail("Name is required."));

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(ApiResponse<SupportTicketDto>.Fail("Email address is required."));

        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            return BadRequest(ApiResponse<SupportTicketDto>.Fail("Phone number is required."));

        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest(ApiResponse<SupportTicketDto>.Fail("Description is required."));

        var ticket = new SupportTicket
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Description = request.Description.Trim(),
            Status = "Open",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        var dto = new SupportTicketDto
        {
            Id = ticket.Id,
            Name = ticket.Name,
            Email = ticket.Email,
            PhoneNumber = ticket.PhoneNumber,
            Description = ticket.Description,
            Status = ticket.Status,
            CreatedAt = ticket.CreatedAt
        };

        return Ok(ApiResponse<SupportTicketDto>.Success(dto, "Your support request has been submitted successfully."));
    }
}
