package com.enera.backend.dto.floor;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateFloorRequest {
    @NotNull(message = "BlockId required")
    private Long blockId;

    @NotNull(message = "Floor Number required")
    private Long floorNumber;

}
