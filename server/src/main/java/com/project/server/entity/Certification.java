package com.project.server.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Certification {

    private String id;

    private String name;

    private String issuer;

    private String dateIssued;

    private String expiryDate;
}