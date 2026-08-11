package com.enera.backend.dto.device;

import lombok.Data;

@Data
public class DeRegisterDeviceResponse {
    private Long deviceId;

    private Boolean status;
}
