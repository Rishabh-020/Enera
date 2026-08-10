package com.enera.backend.dto.society;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SocietyDeviceResponse {
    private Boolean meterStatus;

    private String mappedTo;

    private LocalDateTime lastSeenAt;
}
