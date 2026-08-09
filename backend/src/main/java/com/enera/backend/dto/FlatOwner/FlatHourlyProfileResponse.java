package com.enera.backend.dto.FlatOwner;

import lombok.Data;

import java.util.List;

@Data
public class FlatHourlyProfileResponse {
    List<HourlyPointResponse> profile;

    List<Integer> peakHours;
}
