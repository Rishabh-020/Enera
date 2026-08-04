package com.enera.backend.dto.block;

import com.enera.backend.entity.Society;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateBlockRequest {
    @NotNull(message = "Block Id is required")
    private Long blockId;

    @NotNull(message = "Society id is required")
    private Long societyId;

    @NotBlank(message = "Block name is required")
    private String blockName;
}
