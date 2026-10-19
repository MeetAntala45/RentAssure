using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentAssure.Application.Common.Interfaces;
using RentAssure.Application.Common.Models;
using RentAssure.Application.Features.Support.DTOs;

namespace RentAssure.API.Controllers.v1.Admin;

[ApiController]
[Route("api/admin/support")]
[Authorize(Roles = "Admin")]
public class AdminSupportController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AdminSupportController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SupportTicketDto>>>> GetAllSupportTickets()
    {
        var tickets = await _context.SupportTickets
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new SupportTicketDto
            {
                Id = t.Id,
                Name = t.Name,
                Email = t.Email,
                PhoneNumber = t.PhoneNumber,
                Description = t.Description,
                Status = t.Status,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<SupportTicketDto>>.Success(tickets));
    }

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> UpdateStatus([FromRoute] int id, [FromBody] UpdateSupportTicketStatusDto request)
    {
        var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null)
            return NotFound(ApiResponse<SupportTicketDto>.Fail("Support ticket not found."));

        ticket.Status = request.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

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

        return Ok(ApiResponse<SupportTicketDto>.Success(dto, "Ticket status updated."));
    }
}
