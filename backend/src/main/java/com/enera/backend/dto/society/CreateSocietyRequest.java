package com.enera.backend.dto.society;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Data
public class CreateSocietyRequest {
    @NotBlank(message = "Society name is required")
    private String name;

    @NotNull(message = "Builder ID is required")
    private Long builderId;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotNull(message = "Total blocks is required")
    private Long totalBlocks;
}
