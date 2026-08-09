package com.enera.backend.dto.society;

import lombok.Data;

@Data
public class SocietyFlatResponse {
    private Long id;

    private String flatNumber;

    private String bhkType;

    private boolean occupied;

    private String residentName;

    private String blockName;

    private Long floorNumber;

    private String meterStatus;

    private Double mtdKwh;
}
