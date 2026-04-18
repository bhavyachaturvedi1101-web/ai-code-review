package com.aicodereview.controller;

import com.aicodereview.model.ReviewRequest;
import com.aicodereview.service.CodeExecutorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/execute")
public class ExecuteController {

    private final CodeExecutorService executorService;

    public ExecuteController(CodeExecutorService executorService) {
        this.executorService = executorService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> execute(@Valid @RequestBody ReviewRequest request) {
        String output = executorService.execute(request.code(), request.language());
        return ResponseEntity.ok(Map.of("output", output));
    }
}
