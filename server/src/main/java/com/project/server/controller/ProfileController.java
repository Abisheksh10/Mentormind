package com.project.server.controller;

import com.project.server.dto.CompleteRequest;
import com.project.server.dto.TargetCareerRequest;
import com.project.server.entity.Profile;
import com.project.server.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @PostMapping("/save")
    public Map<String, Object> saveProfile(
            @RequestBody Profile profile,
            Authentication authentication
    ) {

        System.out.println("SAVE PROFILE HIT");
        System.out.println(authentication);

        String userId = authentication.getName();

        return profileService.saveProfile(userId, profile);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(
            Authentication authentication
    ) {

        String userId = authentication.getName();

        return ResponseEntity.ok(
                profileService.getMyProfile(userId)
        );
    }

    @GetMapping("/{id}")
    public Profile getProfileById(
            @PathVariable String id
    ) {

        return profileService.getProfileById(id);
    }

    @PostMapping("/complete")
    public Profile completeItem(
            @RequestBody CompleteRequest request,
            Authentication authentication
    ) {

        String userId = authentication.getName();

        return profileService.completeItem(userId, request);
    }

    @PutMapping("/target-career")
    public ResponseEntity<?> updateTargetCareer(
            @RequestBody TargetCareerRequest request,
            Principal principal
    ) {

        return ResponseEntity.ok(
                profileService.updateTargetCareer(
                        principal.getName(),
                        request.getTargetCareerId()
                )
        );
    }

}