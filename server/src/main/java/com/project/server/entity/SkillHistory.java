package com.project.server.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillHistory {

    private String skill;

    private Integer delta;

    private String reason;

    private Instant ts;
}