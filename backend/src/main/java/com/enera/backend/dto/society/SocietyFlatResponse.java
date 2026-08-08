package com.enera.backend.dto.society;

import lombok.Data;

@Data
public class SocietyFlatResponse {
    private  String name;

    private Long floorNumber;

    private Boolean status;

    private Double mtdKwh;
}
