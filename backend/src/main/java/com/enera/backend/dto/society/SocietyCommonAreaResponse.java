package com.enera.backend.dto.society;

import lombok.Data;

@Data
public class SocietyCommonAreaResponse {
    private Long id;

    private String name;

    private String category;

    private String floorOrLocation;

    private String type;

    private Double currentKw;
}
