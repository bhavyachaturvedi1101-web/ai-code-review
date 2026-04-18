package com.aicodereview.service;

import com.aicodereview.model.ReviewRequest;
import com.aicodereview.model.ReviewResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    @Value("${openai.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ReviewResponse reviewCode(ReviewRequest request) {
        String prompt = buildPrompt(request);

        Map<String, Object> body = Map.of(
            "model", model,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt()),
                Map.of("role", "user", "content", prompt)
            ),
            "temperature", 0,
            "response_format", Map.of("type", "json_object")
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);

        return parseResponse(response.getBody());
    }

    private String systemPrompt() {
        return """
            You are an expert code reviewer. Analyze the provided code and return a JSON response with this exact structure:
            {
              "summary": "brief overall assessment",
              "score": <integer 0-100>,
              "issues": [
                {
                  "severity": "error|warning|info",
                  "category": "security|performance|style|bug|maintainability",
                  "message": "description of the issue",
                  "line": <line number or 0 if general>
                }
              ],
              "improvedCode": "the full improved version of the code"
            }
            Be thorough but concise. Focus on real issues, not nitpicks.
            """;
    }

    private String buildPrompt(ReviewRequest request) {
        String lang = request.language() != null ? request.language() : "auto-detect";
        String focus = request.focusArea() != null ? " Focus especially on: " + request.focusArea() + "." : "";
        return "Language: " + lang + focus + "\n\nCode to review:\n```\n" + request.code() + "\n```";
    }

    private ReviewResponse parseResponse(String rawBody) {
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String content = root.path("choices").get(0).path("message").path("content").asText();
            JsonNode json = objectMapper.readTree(content);

            String summary = json.path("summary").asText("No summary available.");
            int score = json.path("score").asInt(50);
            String improvedCode = json.path("improvedCode").asText("");

            List<ReviewResponse.Issue> issues = new ArrayList<>();
            JsonNode issuesNode = json.path("issues");
            if (issuesNode.isArray()) {
                for (JsonNode issue : issuesNode) {
                    issues.add(new ReviewResponse.Issue(
                        issue.path("severity").asText("info"),
                        issue.path("category").asText("general"),
                        issue.path("message").asText(""),
                        issue.path("line").asInt(0)
                    ));
                }
            }

            return new ReviewResponse(summary, issues, improvedCode, score);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OpenAI response: " + e.getMessage(), e);
        }
    }
}
