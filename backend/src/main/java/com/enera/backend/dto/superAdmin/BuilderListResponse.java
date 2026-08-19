package com.enera.backend.dto.superAdmin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BuilderListResponse {
    private Long id;

    private String name;

    private String email;

    private Integer totalSocieties;

    private Integer totalFlats;

    private Double liveKw;

    private Double mtdKwh;
}
