package com.enera.backend.dto.block;

import lombok.Data;

@Data
public class BlockFlatsResponse {
    private Long id;

    private String floorNumber;

    private Long flatCount;

    private Double mtdKwh;
}
