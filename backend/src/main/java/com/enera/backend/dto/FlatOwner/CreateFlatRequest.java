package com.enera.backend.dto.FlatOwner;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateFlatRequest {
    private Long floorId;

    @NotBlank(message = "Flat number is required")
    private String flatNumber;

    @NotBlank(message = "bhkType is required")
    private String bhkType;
}
