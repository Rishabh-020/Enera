package com.enera.backend.dto.device;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeRegisterDeviceRequest {
    @NotNull(message = "Device id is required")
    private Long deviceId;

    @NotNull(message = "Status is required")
    private Boolean status;
}
