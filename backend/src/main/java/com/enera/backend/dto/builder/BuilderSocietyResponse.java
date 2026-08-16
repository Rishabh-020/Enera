package com.enera.backend.dto.builder;

import lombok.Data;

@Data
public class BuilderSocietyResponse {
    private Long id;

    private String name;

    private String city;

    private Integer totalFlats;

    private Integer occupiedFlats;

    private Double mtdKwh;

    private Double avgPerFlat;

    private Double mom;

    private Double prevMonthKwh;
}
