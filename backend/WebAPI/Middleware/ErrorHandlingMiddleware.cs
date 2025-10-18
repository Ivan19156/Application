using System.Net; // For HttpStatusCode
using System.Text.Json; // For JSON serialization
using Microsoft.AspNetCore.Http; // For HttpContext, RequestDelegate
using Microsoft.Extensions.Logging; // For logging

namespace WebAPI.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Call the next middleware in the pipeline
            await _next(context);
        }
        catch (Exception ex)
        {
            // Log the exception
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);

            // Prepare the response
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError; // Default to 500

            // Create a standardized error response object
            var response = new
            {
                StatusCode = context.Response.StatusCode,
                Message = "An internal server error occurred. Please try again later.",
                // Optional: Include detailed error in development environment only
                // Detail = context.Request.HostEnvironment.IsDevelopment() ? ex.StackTrace?.ToString() : null
            };

            // Serialize the response object to JSON
            var jsonResponse = JsonSerializer.Serialize(response);

            // Write the JSON response to the client
            await context.Response.WriteAsync(jsonResponse);
        }
    }
}