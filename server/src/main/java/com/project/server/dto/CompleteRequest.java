package com.project.server.dto;

import com.project.server.entity.CompletedItem;
import lombok.Data;

@Data
public class CompleteRequest {

    private String type;

    private CompletedItem item;
}