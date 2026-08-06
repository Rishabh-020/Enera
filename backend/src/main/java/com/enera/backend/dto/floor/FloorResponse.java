package com.enera.backend.dto.floor;

import lombok.Data;

@Data
public class FloorResponse {
    private Long id;

    private Long blockId;

    private Long floorNumber;
}
