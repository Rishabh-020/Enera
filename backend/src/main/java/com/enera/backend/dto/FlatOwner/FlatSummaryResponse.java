package com.enera.backend.dto.FlatOwner;

import lombok.Data;
import java.time.DayOfWeek;
import java.util.List;

@Data
public class FlatSummaryResponse {
    private List<DailySeriesResponse> series;

    private Double totalKwh;

    private Double estCost;

    private Double projectedTotal;

    private Double projectedCost;

    private DayOfWeek peakDay;
}
