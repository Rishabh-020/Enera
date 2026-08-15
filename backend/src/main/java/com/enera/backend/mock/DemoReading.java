package com.enera.backend.mock;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

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

    private LocalDateTime timestamp;

    private boolean isDemo;
}
