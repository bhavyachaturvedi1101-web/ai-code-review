package com.aicodereview.controller;

import com.aicodereview.model.ReviewRequest;
import com.aicodereview.model.ReviewResponse;
import com.aicodereview.service.OpenAiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/review")
public class ReviewController {

    private final OpenAiService openAiService;

    public ReviewController(OpenAiService openAiService) {
        this.openAiService = openAiService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> review(@Valid @RequestBody ReviewRequest request) {
        ReviewResponse response = openAiService.reviewCode(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
