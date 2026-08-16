package com.enera.backend.dto.society;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class DailyTrendResponse {
    private String date;

    private Double totalKwh;

    private Double commonAreaKwh;
}
