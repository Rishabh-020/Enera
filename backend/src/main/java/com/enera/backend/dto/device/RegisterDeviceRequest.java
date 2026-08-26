package com.enera.backend.dto.device;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RegisterDeviceRequest {

    @NotNull(message = "Device serial is required")
    private Long deviceSerial;

    @NotBlank(message = "Device type is required")
    private String deviceType;

    private Long flatId;

    private Long commonAreaId;

    private String blockName;

    @NotNull(message = "Society id is required")
    private Long societyId;

    private LocalDateTime lastSeenAt;
}