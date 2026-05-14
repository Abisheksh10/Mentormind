package com.project.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulatedSkillUpdate {

    private String name;

    private Integer proficiency;

    private Double confidence;

    private String reason;
}