package com.project.server.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class MLService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    public Object careerRank(Map<String, Object> payload) {

        return postToML(
                "/predict-careers",
                payload
        );
    }

    public Object skillGaps(Map<String, Object> payload) {

        return postToML(
                "/gap-priority",
                payload
        );
    }

    public Object recommendations(
            Map<String, Object> payload
    ) {

        Object response =
                postToML(
                        "/recommend",
                        payload
                );

        if (!(response instanceof Map<?, ?> data)) {
            return Map.of(
                    "courses", List.of(),
                    "projects", List.of()
            );
        }

        Object courses =
                data.get("courses");

        if (courses == null && data.get("data") instanceof Map<?, ?> nested) {
            courses = nested.get("courses");
        }

        if (courses == null &&
                data.get("recommendations") instanceof Map<?, ?> rec) {
            courses = rec.get("courses");
        }

        if (courses == null) {
            courses = data.get("recommended_courses");
        }

        Object projects =
                data.get("projects");

        if (projects == null && data.get("data") instanceof Map<?, ?> nested) {
            projects = nested.get("projects");
        }

        if (projects == null &&
                data.get("recommendations") instanceof Map<?, ?> rec) {
            projects = rec.get("projects");
        }

        if (projects == null) {
            projects = data.get("recommended_projects");
        }

        return Map.of(
                "courses",
                courses != null ? courses : List.of(),

                "projects",
                projects != null ? projects : List.of()
        );
    }

    private Object postToML(
            String endpoint,
            Map<String, Object> payload
    ) {

        String url = mlServiceUrl + endpoint;

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(payload, headers);

        ResponseEntity<Object> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        entity,
                        Object.class
                );

        return response.getBody();
    }
    private Object firstNonNull(
            Object... values
    ) {

        for (Object value : values) {

            if (value != null) {
                return value;
            }
        }

        return null;
    }

    private Object getNested(
            Map<?, ?> map,
            String parent,
            String child
    ) {

        Object nested =
                map.get(parent);

        if (nested instanceof Map<?, ?> nestedMap) {

            return nestedMap.get(child);
        }

        return null;
    }
}