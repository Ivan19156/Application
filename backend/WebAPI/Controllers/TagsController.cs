using Application.Interfaces.Persistence;
using Contracts.DTOs.Events;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly ITagRepository _tagRepository;

    public TagsController(ITagRepository tagRepository)
    {
        _tagRepository = tagRepository;
    }

  
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TagDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllTags()
    {
        var tags = await _tagRepository.GetAllTagsAsync();
        var tagDtos = tags.Select(t => new TagDto { Id = t.Id, Name = t.Name });
        return Ok(tagDtos);
    }
}
