package com.project.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.server.dto.SimulatedSkillUpdate;
import com.project.server.dto.SimulationExplainRequest;
import com.project.server.dto.SimulationExplainResponse;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AIService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    private final ObjectMapper objectMapper;

    private Client getClient() {

        return Client.builder()
                .apiKey(apiKey)
                .build();
    }

    private String callGemini(
            String prompt
    ) throws Exception {

        Client client =
                getClient();

        GenerateContentResponse response =
                client.models.generateContent(
                        model,
                        prompt,
                        null
                );

        return stripCodeFences(
                response.text()
        );
    }

    public Object extractSkills(
            Map<String, Object> body
    ) {

        try {

            String text =
                    String.valueOf(
                            body.getOrDefault("text", "")
                    );

            List<String> allowedSkills =
                    (List<String>) body.getOrDefault(
                            "allowedSkills",
                            new ArrayList<>()
                    );

            int topK =
                    Integer.parseInt(
                            String.valueOf(
                                    body.getOrDefault("topK", 20)
                            )
                    );

            String prompt = """
You are an information extraction system for MentorMind.

Task:
Extract ONLY primary skills from the TEXT using ONLY the provided ALLOWED_SKILLS list.
Do NOT include subskills unless they appear in ALLOWED_SKILLS.

Return ONLY JSON with this exact shape:
{
  "skills": [
    { "name": string, "proficiency": number, "confidence": number, "evidence": string,
      "signals": { "mentions": number, "projects": number, "certs": number, "internships": number, "years": number }
    }
  ],
  "warnings": []
}

Rules:
- "name" MUST be exactly one of ALLOWED_SKILLS.
- "evidence" MUST be a direct snippet from the text (max 120 chars).
- Extract simple signals:
  mentions = how many times the skill appears (approx)
  projects = count of distinct projects where the skill is used (0..5)
  certs = count of certifications/courses mentioning it (0..5)
  internships = count of experiences mentioning it (0..3)
  years = explicit years of experience found for that skill (0..10). If not explicitly stated, set 0.
- Compute proficiency conservatively:
  * Base range for most skills: 35..70
  * 70..85 ONLY if projects >= 2 OR internships >= 1 AND evidence clearly shows usage
  * 85..95 ONLY if years >= 2 OR multiple internships/projects clearly prove depth
  * 95..100 ONLY if years >= 4 AND clear senior/production ownership evidence
- Return at most %d skills.
- No markdown. No code fences.

ALLOWED_SKILLS:
%s

TEXT:
%s
"""
                    .formatted(
                            topK,
                            allowedSkills,
                            text
                    );

            Client client = getClient();

            GenerateContentResponse response =
                    client.models.generateContent(
                            model,
                            prompt,
                            null
                    );

            String raw =
                    response.text();

            raw = stripCodeFences(raw);

            return objectMapper.readValue(
                    raw,
                    Map.class
            );

        } catch (Exception e) {

            return Map.of(
                    "error",
                    "Gemini request failed.",
                    "details",
                    e.getMessage()
            );
        }
    }

    public SimulationExplainResponse simulationExplain(
            SimulationExplainRequest req
    ) {

        try {

            List<String> requiredVocabulary =
                    new ArrayList<>();

            if (req.getRequiredSkills() != null) {

                for (Map<String, Object> r : req.getRequiredSkills()) {

                    if ("anyOf".equals(r.get("type"))
                            && r.get("options") instanceof List<?> options) {

                        for (Object o : options) {
                            requiredVocabulary.add(
                                    String.valueOf(o)
                            );
                        }

                    } else if (r.get("name") != null) {

                        requiredVocabulary.add(
                                String.valueOf(r.get("name"))
                        );

                    } else if (r.get("skill") != null) {

                        requiredVocabulary.add(
                                String.valueOf(r.get("skill"))
                        );
                    }
                }
            }

            String prompt = """
You are MentorMind AI.

Your task is to simulate the impact of a hypothetical learning scenario on a student's fit for a target career.

Return ONLY valid JSON.

Target Career:
%s

What-if Scenario:
%s

Current Score:
%s

Preliminary Simulated Score:
%s

Delta:
%s

Current Skills:
%s

Required Skills for Target Career:
%s

Allowed Canonical Skill Vocabulary:
%s

Detected Temporary Skill Boosts So Far:
%s

Remaining Missing Skills:
%s

Rules:
- Return JSON only.
- Use keys:
  summary,
  whyChanged,
  nextActions,
  warnings,
  simulatedSkillUpdates
- nextActions must be an array of 3 short concrete strings.
- warnings must be an array.
- simulatedSkillUpdates must be an array of objects with:
  name, proficiency, confidence, reason
- Only include skills from the Allowed Canonical Skill Vocabulary.
- Estimate temporary skill impact from the what-if scenario.
- If the scenario implies learning but not mastery, do not assign extreme proficiencies.
- Prefer realistic temporary proficiency levels (for example 45 to 65 for newly learned skills, unless strong current skill context supports higher).
- If the scenario does not clearly affect a skill, do not include it.
- If delta <= 0, explain why and suggest more relevant target-career skills.
- No markdown.
"""
                    .formatted(
                            req.getCareerTitle(),
                            req.getWhatIfText(),
                            req.getOldScore(),
                            req.getNewScore(),
                            req.getDelta(),
                            objectMapper.writeValueAsString(req.getCurrentSkills()),
                            objectMapper.writeValueAsString(req.getRequiredSkills()),
                            objectMapper.writeValueAsString(requiredVocabulary),
                            objectMapper.writeValueAsString(req.getDetectedBoosts()),
                            objectMapper.writeValueAsString(req.getTopMissing())
                    );

            String raw =
                    callGemini(prompt);

            JsonNode parsed =
                    safeJsonParse(raw);

            if (parsed == null) {

                return fallbackSimulation();
            }

            SimulationExplainResponse response =
                    new SimulationExplainResponse();

            response.setSummary(
                    parsed.has("summary")
                            ? parsed.get("summary").asText()
                            : "Simulation complete."
            );

            response.setWhyChanged(
                    parsed.has("whyChanged")
                            ? parsed.get("whyChanged").asText()
                            : "Your scenario did not significantly affect the required skills for this career."
            );

            List<String> nextActions =
                    new ArrayList<>();

            if (parsed.has("nextActions")
                    && parsed.get("nextActions").isArray()) {

                for (JsonNode n : parsed.get("nextActions")) {
                    nextActions.add(n.asText());
                }
            }

            response.setNextActions(nextActions);

            List<String> warnings =
                    new ArrayList<>();

            if (parsed.has("warnings")
                    && parsed.get("warnings").isArray()) {

                for (JsonNode n : parsed.get("warnings")) {
                    warnings.add(n.asText());
                }
            }

            response.setWarnings(warnings);

            List<SimulatedSkillUpdate> updates =
                    new ArrayList<>();

            if (parsed.has("simulatedSkillUpdates")
                    && parsed.get("simulatedSkillUpdates").isArray()) {

                for (JsonNode n : parsed.get("simulatedSkillUpdates")) {

                    SimulatedSkillUpdate s =
                            new SimulatedSkillUpdate();

                    s.setName(
                            n.has("name")
                                    ? n.get("name").asText()
                                    : ""
                    );

                    s.setProficiency(
                            n.has("proficiency")
                                    ? n.get("proficiency").asInt()
                                    : 0
                    );

                    s.setConfidence(
                            n.has("confidence")
                                    ? n.get("confidence").asDouble()
                                    : 0.7
                    );

                    s.setReason(
                            n.has("reason")
                                    ? n.get("reason").asText()
                                    : ""
                    );

                    updates.add(s);
                }
            }

            response.setSimulatedSkillUpdates(updates);

            return response;

        } catch (Exception e) {

            return fallbackSimulation();
        }
    }

    private String stripCodeFences(
            String s
    ) {

        return s
                .replace("```json", "")
                .replace("```", "")
                .trim();
    }
    private JsonNode safeJsonParse(
            String text
    ) {

        try {

            return objectMapper.readTree(
                    stripCodeFences(text)
            );

        } catch (Exception e) {

            return null;
        }
    }
    private SimulationExplainResponse fallbackSimulation() {

        return new SimulationExplainResponse(
                "Simulation complete.",
                "Your scenario did not significantly affect the required skills for this career.",
                List.of(
                        "Improve one core required skill",
                        "Build one practical project",
                        "Update your profile with stronger evidence"
                ),
                List.of(
                        "AI response was invalid, fallback used."
                ),
                List.of()
        );
    }
}