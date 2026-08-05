package com.enera.backend.dto.dashboard;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DeviceStatusResponse {

    private Long deviceId;

    private Long deviceSerial;

    private String deviceType;

    private String status;

    private LocalDateTime lastSeenAt;
}