package com.enera.backend.dto.FlatOwner;

import java.time.DayOfWeek;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DailySeriesResponse {
    private DayOfWeek day;

    private Double kwh;
}
