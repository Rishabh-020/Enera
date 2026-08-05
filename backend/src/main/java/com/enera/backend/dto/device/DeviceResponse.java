package com.enera.backend.dto.device;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeviceResponse {
    private Long id;

    private Long deviceSerial;

    private String deviceType;

    private Long flatId;

    private Long commonAreaId;

    private Long societyId;

    private boolean status;

    private LocalDateTime registeredAt;

    private LocalDateTime lastSeenAt;
}
