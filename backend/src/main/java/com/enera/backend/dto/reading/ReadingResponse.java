package com.enera.backend.dto.reading;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReadingResponse {
    private Long id;

    private Long deviceId;

    private Double kw;

    private Double kwh;

    private LocalDateTime timestamp;

    private LocalDateTime createdAt;
}
