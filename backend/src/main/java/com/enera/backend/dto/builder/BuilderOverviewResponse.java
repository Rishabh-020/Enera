package com.enera.backend.dto.builder;

import lombok.Data;

@Data
public class BuilderOverviewResponse {
    private Long id;

    private String name;

    private Integer totalSocieties;

    private Integer totalBlocks;

    private Integer devicesOnline;

    private Double mtdKwh;

    private Double mtdCost;
}
