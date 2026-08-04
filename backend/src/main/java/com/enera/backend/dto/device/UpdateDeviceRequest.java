package com.enera.backend.dto.device;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateDeviceRequest {
        @NotNull(message = "Flat id is required")
        private Long flatId;

        @NotNull(message = "Common area id is required")
        private Long commonAreaId;

        private boolean status;
}

