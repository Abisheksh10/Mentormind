package com.project.server.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JobsService {

    @Value("${adzuna.app.id}")
    private String appId;

    @Value("${adzuna.app.key}")
    private String appKey;

    private final RestTemplate restTemplate =
            new RestTemplate();

    public Object getJobs(
            String role,
            String location,
            String skills
    ) {

        try {

            String where =
                    normalizeLocation(location);

            List<String> topSkills =
                    pickTopSkills(skills, 6);

            String whatOr =
                    String.join(" OR ", topSkills);

            if (appId == null || appKey == null) {

                return Map.of(
                        "role", role,
                        "location", location,
                        "jobs", List.of(),
                        "fallbackLinks",
                        buildFallbackLinks(role, location),
                        "note",
                        "Adzuna API keys not configured"
                );
            }

            String url =
                    "https://api.adzuna.com/v1/api/jobs/in/search/1"
                            + "?app_id=" + encode(appId)
                            + "&app_key=" + encode(appKey)
                            + "&results_per_page=5"
                            + "&what=" + encode(role)
                            + "&where=" + encode(where)
                            + "&sort_by=relevance";

            if (!whatOr.isBlank()) {
                url += "&what_or=" + encode(whatOr);
            }

            HttpHeaders headers =
                    new HttpHeaders();

            headers.setAccept(
                    List.of(MediaType.APPLICATION_JSON)
            );

            HttpEntity<Void> entity =
                    new HttpEntity<>(headers);

            ResponseEntity<Map> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            entity,
                            Map.class
                    );

            Map body = response.getBody();

            List<Map<String, Object>> jobs =
                    new ArrayList<>();

            if (body != null &&
                    body.get("results") instanceof List<?> results) {

                for (Object obj : results) {

                    if (obj instanceof Map<?, ?> j) {

                        jobs.add(
                                mapAdzunaJob(j)
                        );
                    }
                }
            }

            if (jobs.isEmpty()) {

                return Map.of(
                        "role", role,
                        "location", location,
                        "jobs", List.of(),
                        "fallbackLinks",
                        buildFallbackLinks(role, location),
                        "note",
                        "No Adzuna jobs returned"
                );
            }

            return Map.of(
                    "role", role,
                    "location", location,
                    "jobs", jobs,
                    "fallbackLinks", List.of(),
                    "note", "Live jobs from Adzuna"
            );

        } catch (Exception e) {

            return Map.of(
                    "role", role,
                    "location", location,
                    "jobs", List.of(),
                    "fallbackLinks",
                    buildFallbackLinks(role, location),
                    "note",
                    "Adzuna request failed"
            );
        }
    }

    private String normalizeLocation(
            String location
    ) {

        if (location == null ||
                location.equalsIgnoreCase("India")) {

            return "Bengaluru";
        }

        return location;
    }

    private List<String> pickTopSkills(
            String skills,
            int max
    ) {

        if (skills == null || skills.isBlank()) {
            return List.of();
        }

        return Arrays.stream(
                        skills.split(",")
                )
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .limit(max)
                .collect(Collectors.toList());
    }

    private List<Map<String, String>>
    buildFallbackLinks(
            String role,
            String location
    ) {

        String q = encode(role);
        String loc = encode(location);

        return List.of(
                Map.of(
                        "site", "LinkedIn",
                        "url",
                        "https://www.linkedin.com/jobs/search/?keywords="
                                + q + "&location=" + loc
                ),

                Map.of(
                        "site", "Naukri",
                        "url",
                        "https://www.naukri.com/"
                                + q + "-jobs-in-" + loc
                ),

                Map.of(
                        "site", "Indeed",
                        "url",
                        "https://in.indeed.com/jobs?q="
                                + q + "&l=" + loc
                ),

                Map.of(
                        "site", "Internshala",
                        "url",
                        "https://internshala.com/jobs/"
                                + q + "-jobs/"
                ),

                Map.of(
                        "site", "Foundit",
                        "url",
                        "https://www.foundit.in/srp/results?query="
                                + q + "&locations=" + loc
                )
        );
    }

    private Map<String, Object> mapAdzunaJob(
            Map<?, ?> j
    ) {

        Map<String, Object> mapped =
                new HashMap<>();

        mapped.put(
                "title",
                j.get("title") != null
                        ? j.get("title").toString()
                        : ""
        );

        Object companyObj =
                j.get("company");

        if (companyObj instanceof Map<?, ?> company) {

            mapped.put(
                    "company",
                    String.valueOf(
                            company.get("display_name")
                    )
            );
        } else {

            mapped.put("company", "");
        }

        Object locationObj =
                j.get("location");

        if (locationObj instanceof Map<?, ?> loc) {

            Object displayName =
                    loc.get("display_name");

            mapped.put(
                    "location",
                    displayName != null
                            ? displayName.toString()
                            : "India"
            );

        } else {

            mapped.put("location", "India");
        }

        mapped.put(
                "salaryMin",
                j.get("salary_min")
        );

        mapped.put(
                "salaryMax",
                j.get("salary_max")
        );

        mapped.put(
                "salaryCurrency",
                j.get("salary_currency")
        );

        mapped.put(
                "created",
                j.get("created")
        );

        mapped.put(
                "url",
                j.get("redirect_url")
        );

        mapped.put(
                "applyLink",
                j.get("redirect_url")
        );

        mapped.put(
                "source",
                "Adzuna"
        );

        return mapped;
    }

    private String encode(
            String value
    ) {

        return URLEncoder.encode(
                value,
                StandardCharsets.UTF_8
        );
    }
}