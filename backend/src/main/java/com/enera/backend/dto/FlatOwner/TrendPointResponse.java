package com.enera.backend.dto.FlatOwner;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class TrendPointResponse {
    private LocalDate date;

    private Double kwh;

    private Double rollingAvg;
}
