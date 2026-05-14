package com.project.server.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class SimulationExplainRequest {

    private String careerTitle;

    private String whatIfText;

    private Integer oldScore;

    private Integer newScore;

    private Integer delta;

    private List<Map<String, Object>> detectedBoosts;

    private List<Map<String, Object>> topMissing;

    private List<Map<String, Object>> currentSkills;

    private List<Map<String, Object>> requiredSkills;
}