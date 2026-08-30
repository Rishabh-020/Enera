package com.enera.backend.util;

public final class EnergyConstants {

    private EnergyConstants() {
        // This constructor prevent the instantiation of this class
    }

    public static final double COST_PER_KWH = 8.0;
    public static final double BASE_LOAD_RATIO = 0.30;
    public static final double REGULAR_LOAD_RATIO = 0.50;
    public static final double PEAK_LOAD_RATIO = 0.20;
    public static final double ROUND_ONE_DECIMAL = 10.0;
    public static final double ROUND_TWO_DECIMALS = 100.0;
    public static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";
}
