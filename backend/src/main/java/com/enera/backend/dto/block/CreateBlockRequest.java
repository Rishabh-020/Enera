package com.enera.backend.dto.block;

import com.enera.backend.entity.Society;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateBlockRequest {
    @NotNull(message = "Society is required")
    private Long societyId;

    @NotBlank(message = "Block name is required")
    private String blockName;
}
