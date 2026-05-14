package com.project.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationExplainResponse {

    private String summary;

    private String whyChanged;

    private List<String> nextActions;

    private List<String> warnings;

    private List<SimulatedSkillUpdate> simulatedSkillUpdates;
}