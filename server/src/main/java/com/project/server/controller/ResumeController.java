package com.project.server.controller;

import com.project.server.service.ResumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;

    @PostMapping("/parse")
    public ResponseEntity<?> parseResume(
            @RequestParam("file") MultipartFile file
    ) {

        return ResponseEntity.ok(
                resumeService.parseResume(file)
        );
    }
}