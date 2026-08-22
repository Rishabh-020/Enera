package com.enera.backend.dto.society;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeleteSocietyRequest {
    @NotBlank(message = "Society name is required")
    private String societyName;
}
