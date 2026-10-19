using RentAssure.API.Extensions;
using RentAssure.API.Filters;
using RentAssure.API.Middleware;
using RentAssure.Infrastructure;
using Serilog;

// ─── Bootstrap Logger (catches startup errors) ─────────────────────
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting RentAssure API...");

    var builder = WebApplication.CreateBuilder(args);

    // ─── Serilog ────────────────────────────────────────────────────
    builder.Host.UseSerilog((context, services, configuration) =>
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console());

    // ─── Services ───────────────────────────────────────────────────
    builder.Services.AddControllers(options =>
    {
        options.Filters.Add<ValidationFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

    builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(msg => !string.IsNullOrWhiteSpace(msg))
                .ToList();

            var response = RentAssure.Application.Common.Models.ApiResponse<object>.Fail(
                errors.FirstOrDefault() ?? "Invalid request payload.",
                nameof(RentAssure.Domain.Enums.AuthErrorCode.ValidationFailed),
                errors);

            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(response);
        };
    });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // Auth, CORS, Validation
    builder.Services.AddAuth(builder.Configuration);
    builder.Services.AddAppCors(builder.Configuration);
    builder.Services.AddAppValidation();

    // Infrastructure (EF Core, Repositories, Services)
    builder.Services.AddInfrastructure(builder.Configuration);

    var app = builder.Build();

    // ─── Middleware Pipeline ────────────────────────────────────────
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();

    // In local multi-port dev, allow direct HTTP and HTTPS without redirection
    // app.UseHttpsRedirection();
    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    // ─── Database Seeding ───────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<RentAssure.Infrastructure.Persistence.ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        try
        {
            await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.MigrateAsync(dbContext.Database);
            await RentAssure.Infrastructure.Persistence.DatabaseSeeder.SeedAsync(dbContext, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database migration or seeding.");
        }
    }

    Log.Information("RentAssure API started successfully.");
    app.Run();
}
catch (Exception ex) when (ex is not Microsoft.Extensions.Hosting.HostAbortedException)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
