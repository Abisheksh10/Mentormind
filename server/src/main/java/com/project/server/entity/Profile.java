package com.project.server.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "profiles")
public class Profile {

    @Id
    private String id;

    private String userId;

    private String studentName;

    private String studentId;

    private String department;

    private String major;

    private String academicYear;

    private String bio;

    private String linkedinUrl;

    private List<SemesterStat> semesterStats;

    private List<Certification> certifications;

    private Integer creditsEarned;

    private Double gpa;

    private List<Skill> skills;

    private String targetCareerId;

    private Map<String, Object> academics;

    private Map<String, Object> digitalTwin;

    private List<CompletedItem> completedCourses;

    private List<CompletedItem> completedProjects;

    private List<SkillHistory> skillHistory;

    private Instant createdAt;

    private Instant updatedAt;
}