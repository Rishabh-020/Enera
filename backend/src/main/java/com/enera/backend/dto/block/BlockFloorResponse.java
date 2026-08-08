package com.enera.backend.dto.block;

import lombok.Data;

@Data
public class BlockFloorResponse {
    private Long id;

    private Long floorNumber;

    private Long flatCount;

    private Double mtdKwh;
}
