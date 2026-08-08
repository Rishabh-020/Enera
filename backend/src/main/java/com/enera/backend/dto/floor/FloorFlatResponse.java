package com.enera.backend.dto.floor;

import lombok.Data;

@Data
public class FloorFlatResponse {
    private Long id;

    private Boolean status;

    private Double mtdKwh;
}
