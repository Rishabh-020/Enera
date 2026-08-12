package com.enera.backend.mock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemoDevice {
    private Long deviceId;

    private Long deviceSerial;

    private String deviceType;

    private Double baseKw;

    private Boolean isActive;

    private String mappedTo;

    private Long societyId;

    private Long flatId;

    private String flatNumber;

    private Long commonAreaId;

    private String commonAreaName;
}
