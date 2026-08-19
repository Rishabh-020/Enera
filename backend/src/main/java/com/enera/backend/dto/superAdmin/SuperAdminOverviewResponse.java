package com.enera.backend.dto.superAdmin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SuperAdminOverviewResponse {
    private Long totalBuilders;

    private Long totalSocieties;

    private Long totalBlocks;

    private Long totalFlats;

    private Long totalMeters;

    private Double liveGridKw;

    private Double mtdKwh;
}
