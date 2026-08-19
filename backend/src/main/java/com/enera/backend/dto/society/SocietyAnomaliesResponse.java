package com.enera.backend.dto.society;

import lombok.Data;

@Data
public class SocietyAnomaliesResponse {
    private Long id;

    private String flat;

    private String flatId;

    private String flatNumber;

    private String blockName;

    private Double currentKw;

    private Double expectedKw;

    private String multiplier;

    private String desc;

    private String description;

    private String detectedAt;

    private Boolean resolved;
}
