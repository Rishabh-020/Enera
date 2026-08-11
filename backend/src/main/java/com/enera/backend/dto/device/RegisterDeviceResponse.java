package com.enera.backend.dto.device;

import lombok.Data;

@Data
public class RegisterDeviceResponse {
    private Long deviceSerial;

    private String deviceType;

    private String mappedTo;

    private Long societyId;
}
