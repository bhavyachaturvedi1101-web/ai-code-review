package com.aicodereview.model;

import java.util.List;

public record ReviewResponse(
    String summary,
    List<Issue> issues,
    String improvedCode,
    int score
) {
    public record Issue(
        String severity,   // "error" | "warning" | "info"
        String category,   // "security" | "performance" | "style" | "bug"
        String message,
        int line
    ) {}
}
