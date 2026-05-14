package com.project.server.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SemesterStat {

    private String id;

    private String term;

    private Double gpa;

    private Integer credits;

    private String status;
}