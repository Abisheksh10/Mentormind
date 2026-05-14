package com.project.server.controller;

import com.project.server.dto.SimulationExplainRequest;
import com.project.server.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/extract-skills")
    public ResponseEntity<?> extractSkills(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                aiService.extractSkills(body)
        );
    }

    @PostMapping("/simulation-explain")
    public ResponseEntity<?> simulationExplain(
            @RequestBody SimulationExplainRequest request
    ) {

        return ResponseEntity.ok(
                aiService.simulationExplain(request)
        );
    }
}