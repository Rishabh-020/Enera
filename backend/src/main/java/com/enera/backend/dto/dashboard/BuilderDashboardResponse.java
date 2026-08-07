package com.enera.backend.dto.dashboard;

import lombok.Data;

@Data
public class BuilderDashboardResponse {
    private Long totalSocieties;

    private Long totalBlocks;

    private Long totalFlats;

    private Long totalDevices;

    private Double totalEnergyConsumed;

    private Double totalCost;
}
