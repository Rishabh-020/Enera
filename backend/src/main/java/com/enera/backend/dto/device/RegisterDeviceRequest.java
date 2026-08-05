package com.enera.backend.dto.device;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterDeviceRequest {

    @NotNull(message = "Device serial is required")
    private Long deviceSerial;

    @NotBlank(message = "Device type is required")
    private String deviceType;

    @NotNull(message = "Flat id is required")
    private Long flatId;

    @NotNull(message = "Common area id is required")
    private Long commonAreaId;

    @NotNull(message = "Society id is required")
    private Long societyId;
}