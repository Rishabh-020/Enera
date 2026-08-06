package com.enera.backend.dto.dashboard;

import lombok.Data;

@Data
public class SocietyDashboardResponse {
    private Long totalBlocks;

    private Long totalFlats;

    private Long occupiedFlats;

    private Long totalDevices;

    private Double todayConsumption;

    private Double monthlyConsumption;
}
