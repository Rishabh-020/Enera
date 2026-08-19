package com.enera.backend.mock;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DemoReading {
    private Long deviceId;

    private Long deviceSerial;

    private String deviceType;

    private Long societyId;

    private Long flatId;

    private String flatNumber;

    private Long commonAreaId;

    private String commonAreaName;

    private double kw;

    private double kwh;

    private String timestamp;

    private boolean isDemo;
}


