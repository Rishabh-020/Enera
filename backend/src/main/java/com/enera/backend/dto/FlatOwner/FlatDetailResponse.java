package com.enera.backend.dto.FlatOwner;

import lombok.Data;

@Data
public class FlatDetailResponse {
    private String flatNumber;

    private String residentName;

    private String bhkType;

    private String blockName;

    private Long floorNumber;
}
