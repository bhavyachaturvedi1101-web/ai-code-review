package com.aicodereview.model;

import jakarta.validation.constraints.NotBlank;

public record ReviewRequest(
    @NotBlank(message = "Code cannot be blank")
    String code,

    String language,
    String focusArea
) {}
