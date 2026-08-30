package com.enera.backend.util;

import com.enera.backend.dto.society.HourlyBreakDownResponse;

import java.util.ArrayList;
import java.util.List;

public final class EnergyCalculationUtils {

    private EnergyCalculationUtils() {
        // This constructor prevent the instantiation of this class
    }

    public static double[][] buildHeatmapMatrix(List<Object[]> rows) {
        double[][] grid = new double[7][24];
        if (rows == null) {
            return grid;
        }

        for (Object[] row : rows) {
            if (row == null || row.length < 3) continue;

            int day = ((Number) row[0]).intValue();
            int hour = ((Number) row[1]).intValue();
            double avgKw = ((Number) row[2]).doubleValue();

            if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
                grid[day][hour] = Math.round(avgKw * EnergyConstants.ROUND_TWO_DECIMALS) / EnergyConstants.ROUND_TWO_DECIMALS;
            }
        }
        return grid;
    }

    public static List<HourlyBreakDownResponse> calculateHourlyBreakdown(List<Object[]> rows) {
        List<HourlyBreakDownResponse> responses = new ArrayList<>();
        if (rows == null) {
            return responses;
        }

        for (Object[] row : rows) {
            if (row == null || row.length < 3) continue;

            int hourNum = ((Number) row[0]).intValue();
            String hour = hourNum + ":00";

            double totalFlatKwh = ((Number) row[1]).doubleValue();
            double commonKwh = ((Number) row[2]).doubleValue();

            double baseKwh = Math.round(totalFlatKwh * EnergyConstants.BASE_LOAD_RATIO * EnergyConstants.ROUND_ONE_DECIMAL) / EnergyConstants.ROUND_ONE_DECIMAL;
            double societyKwh = Math.round(totalFlatKwh * EnergyConstants.REGULAR_LOAD_RATIO * EnergyConstants.ROUND_ONE_DECIMAL) / EnergyConstants.ROUND_ONE_DECIMAL;
            double peekKwh = Math.round(totalFlatKwh * EnergyConstants.PEAK_LOAD_RATIO * EnergyConstants.ROUND_ONE_DECIMAL) / EnergyConstants.ROUND_ONE_DECIMAL;
            double commonAreaKwh = Math.round(commonKwh * EnergyConstants.ROUND_ONE_DECIMAL) / EnergyConstants.ROUND_ONE_DECIMAL;

            responses.add(new HourlyBreakDownResponse(hour, baseKwh, societyKwh, commonAreaKwh, peekKwh));
        }

        return responses;
    }
}
