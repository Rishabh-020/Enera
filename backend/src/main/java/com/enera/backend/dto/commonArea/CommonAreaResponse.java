package com.enera.backend.dto.commonArea;

import lombok.Data;

@Data
public class CommonAreaResponse {

    private Long id;

    private Long societyId;

    private String societyName;

    private String name;

    private String category;

    private String floorOrLocation;
}