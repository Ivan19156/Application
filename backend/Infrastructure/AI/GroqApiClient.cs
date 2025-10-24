using Application.Interfaces.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Infrastructure.AI.Models; 

namespace Infrastructure.AI;

public class GroqApiClient : IGroqApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GroqApiClient> _logger;
    private readonly string? _apiKey;

    public GroqApiClient(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<GroqApiClient> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _logger = logger;
        _apiKey = configuration["Groq:ApiKey"];
        
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogError("Groq API key not found in configuration (Groq:ApiKey).");
            throw new InvalidOperationException("Groq API key not found.");
        }

        _httpClient.BaseAddress = new Uri("https://api.groq.com/openai/v1/");
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
    }

    public async Task<string> GenerateChatResponseAsync(string systemPrompt, string userMessage)
    {
        var request = new GroqRequest
        {
            Model = "llama-3.3-70b-versatile", 
            Messages = new List<GroqMessage>
            {
                new GroqMessage { Role = "system", Content = systemPrompt },
                new GroqMessage { Role = "user", Content = userMessage }
            },
            Temperature = 0.7,
            MaxTokens = 1024
        };

        try
        {
            
            var response = await _httpClient.PostAsJsonAsync("chat/completions", request);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Groq API returned a non-success status code: {StatusCode}. Body: {ErrorBody}", response.StatusCode, errorBody);
                response.EnsureSuccessStatusCode(); 
            }

            var result = await response.Content.ReadFromJsonAsync<GroqResponse>();
            return result?.Choices?.FirstOrDefault()?.Message?.Content 
                ?? "Sorry, I couldn't generate a response at this time.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Groq API Error occurred.");
            return "There was an error contacting the AI assistant. Please try again later.";
        }
    }
}

