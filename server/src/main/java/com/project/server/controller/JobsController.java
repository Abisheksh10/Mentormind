package com.project.server.controller;

import com.project.server.service.JobsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
public class JobsController {

    @Autowired
    private JobsService jobsService;

    @GetMapping
    public ResponseEntity<?> getJobs(
            @RequestParam String role,
            @RequestParam String location,
            @RequestParam String skills
    ) {

        return ResponseEntity.ok(
                jobsService.getJobs(
                        role,
                        location,
                        skills
                )
        );
    }
}