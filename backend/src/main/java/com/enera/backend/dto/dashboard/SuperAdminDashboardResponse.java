package com.enera.backend.dto.dashboard;

import lombok.Data;

@Data
public class SuperAdminDashboardResponse {
    private Long totalBuilders;

    private Long totalSocieties;

    private Long totalUsers;

    private Long totalDevices;

    private Long activeDevices;
}
