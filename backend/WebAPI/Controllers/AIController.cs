using Contracts.DTOs.AI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Application.Interfaces;
using Application.Interfaces.Services;
using Application.Services;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize] 
public class AIController : ControllerBase
{
    private readonly IAiService _aiService;

    public AIController(IAiService aiService)
    {
        _aiService = aiService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID claim not found or invalid in token.");
        }
        return userId;
    }

    [HttpPost("ask")]
    [ProducesResponseType(typeof(AIResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AskQuestion([FromBody] AskQuestionDto requestDto)
    {
        var userId = GetCurrentUserId();
        
        var responseText = await _aiService.GetAssistanceAsync(requestDto.Question, userId);

        var responseDto = new AIResponseDto
        {
            Answer = responseText
        };
        
        return Ok(responseDto);
    }
}
