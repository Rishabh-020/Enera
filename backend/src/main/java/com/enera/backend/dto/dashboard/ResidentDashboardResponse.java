package com.enera.backend.dto.dashboard;

import lombok.Data;

@Data
public class ResidentDashboardResponse {
    private Double currentPower;

    private Double todayConsumption;

    private Double monthlyConsumption;

    private Double averageDailyConsumption;
}
