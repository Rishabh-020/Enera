package com.enera.backend.dto.society;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class HourlyBreakDownResponse {
    private String hour;

    private Double baseKwh;

    private Double societyKwh;

    private Double commonAreaKwh;

    private Double peekKwh;
}
