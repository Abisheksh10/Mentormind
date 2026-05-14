package com.project.server.service;

import com.project.server.entity.Profile;
import com.project.server.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.project.server.dto.CompleteRequest;
import com.project.server.entity.CompletedItem;
import com.project.server.entity.Skill;
import com.project.server.entity.SkillHistory;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.util.Map;

@Service
public class ProfileService {

    @Autowired
    private ProfileRepository profileRepository;

    public Map<String, Object> saveProfile(
            String userId,
            Profile requestProfile
    ) {

        Profile profile = profileRepository
                .findByUserId(userId)
                .orElse(new Profile());

        requestProfile.setId(profile.getId());

        requestProfile.setUserId(userId);

        requestProfile.setCreatedAt(
                profile.getCreatedAt() != null
                        ? profile.getCreatedAt()
                        : Instant.now()
        );

        requestProfile.setUpdatedAt(Instant.now());

        Profile savedProfile = profileRepository.save(requestProfile);

        return Map.of(
                "ok", true,
                "profile", savedProfile
        );
    }

    public Profile getProfileById(String id) {

        return profileRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Profile not found")
                );
    }
    public Profile completeItem(
            String userId,
            CompleteRequest request
    ) {

        Profile profile = profileRepository
                .findByUserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("Profile not found")
                );

        if (profile.getSkills() == null) {
            profile.setSkills(new ArrayList<>());
        }

        if (profile.getSkillHistory() == null) {
            profile.setSkillHistory(new ArrayList<>());
        }

        if ("course".equals(request.getType())) {

            if (profile.getCompletedCourses() == null) {
                profile.setCompletedCourses(new ArrayList<>());
            }

            boolean alreadyExists = profile.getCompletedCourses()
                    .stream()
                    .anyMatch(c ->
                            c.getTitle().equalsIgnoreCase(
                                    request.getItem().getTitle()
                            )
                    );

            if (alreadyExists) {
                return profile;
            }

            CompletedItem item = request.getItem();

            item.setId(UUID.randomUUID().toString());

            item.setCompletedAt(java.time.Instant.now());

            profile.getCompletedCourses().add(item);

        } else if ("project".equals(request.getType())) {

            if (profile.getCompletedProjects() == null) {
                profile.setCompletedProjects(new ArrayList<>());
            }

            boolean alreadyExists = profile.getCompletedProjects()
                    .stream()
                    .anyMatch(p ->
                            p.getTitle().equalsIgnoreCase(
                                    request.getItem().getTitle()
                            )
                    );

            if (alreadyExists) {
                return profile;
            }

            CompletedItem item = request.getItem();

            item.setId(UUID.randomUUID().toString());

            item.setCompletedAt(java.time.Instant.now());

            profile.getCompletedProjects().add(item);
        }

        List<String> itemSkills = request.getItem().getSkills();

        if (itemSkills != null) {

            for (String skillName : itemSkills) {

                Skill existingSkill = profile.getSkills()
                        .stream()
                        .filter(s ->
                                s.getName().equalsIgnoreCase(skillName)
                        )
                        .findFirst()
                        .orElse(null);

                if (existingSkill != null) {

                    int updated =
                            Math.min(
                                    existingSkill.getProficiency() + 10,
                                    100
                            );

                    existingSkill.setProficiency(updated);

                } else {

                    Skill newSkill = Skill.builder()
                            .name(skillName)
                            .proficiency(10)
                            .category("technical")
                            .build();

                    profile.getSkills().add(newSkill);
                }

                SkillHistory history = SkillHistory.builder()
                        .skill(skillName)
                        .delta(10)
                        .reason("course_completed")
                        .ts(java.time.Instant.now())
                        .build();

                profile.getSkillHistory().add(history);
            }
        }

        profile.setUpdatedAt(java.time.Instant.now());

        return profileRepository.save(profile);
    }

    public Object updateTargetCareer(
            String userId,
            String targetCareerId
    ) {

        Profile profile = profileRepository
                .findByUserId(userId)
                .orElse(new Profile());

        profile.setUserId(userId);
        profile.setTargetCareerId(targetCareerId);

        profileRepository.save(profile);

        return Map.of(
                "ok", true,
                "targetCareerId", targetCareerId
        );
    }

    public Object getMyProfile(String userId) {

        Profile profile = profileRepository
                .findByUserId(userId)
                .orElse(null);

        return Map.of(
                "ok", true,
                "profile", profile
        );
    }
}