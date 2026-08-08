package com.enera.backend.dto.society;

import lombok.Data;

@Data
public class SocietyOverviewResponse {
    private String name;

    private Double liveKw;

    private Integer totalFlats;

    private Integer occupiedFlats;

    private Integer devicesOnline;

    private Integer devicesOffline;

    private Double mtdKwh;

    private Double mtdCost;
}
