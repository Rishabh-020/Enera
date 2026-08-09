package com.enera.backend.dto.FlatOwner;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class HourlyPointResponse {
    private Integer hour;

    private Double kwh;
}
