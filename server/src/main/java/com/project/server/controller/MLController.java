package com.project.server.controller;

import com.project.server.service.MLService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ml")
public class MLController {

    @Autowired
    private MLService mlService;

    @PostMapping("/career-rank")
    public Object careerRank(
            @RequestBody Map<String, Object> payload
    ) {

        return mlService.careerRank(payload);
    }

    @PostMapping("/skill-gaps")
    public Object skillGaps(
            @RequestBody Map<String, Object> payload
    ) {

        return mlService.skillGaps(payload);
    }

    @PostMapping("/recommendations")
    public ResponseEntity<?> recommendations(
            @RequestBody Map<String, Object> payload
    ) {

        return ResponseEntity.ok(
                mlService.recommendations(payload)
        );
    }
}