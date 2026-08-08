package com.enera.backend.dto.floor;

import lombok.Data;

@Data
public class FloorFlatResponse {
    private Long id;

    private String flatNumber;

    private String bhkType;

    private String residentName;

    private String meterStatus;

    private Double mtdKwh;
}
