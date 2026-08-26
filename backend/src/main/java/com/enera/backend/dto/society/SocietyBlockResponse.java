package com.enera.backend.dto.society;

import lombok.Data;

@Data
public class SocietyBlockResponse {
    private Long id;

    private String name;

    private String blockName;

    private Double liveKw;

    private Double todayKwh;

    private Double mtdKwh;

    private Long flatCount;

    private Boolean aboveAverage;

}
