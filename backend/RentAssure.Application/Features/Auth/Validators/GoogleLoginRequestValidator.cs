using FluentValidation;
using RentAssure.Application.Features.Auth.DTOs;

namespace RentAssure.Application.Features.Auth.Validators;

public class GoogleLoginRequestValidator : AbstractValidator<GoogleLoginRequestDto>
{
    public GoogleLoginRequestValidator()
    {
        RuleFor(x => x.IdToken)
            .NotEmpty().WithMessage("Google ID token is required.");
    }
}
