package com.enera.backend.dto.society;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SocietyResponse {
    private Long id;

    private String name;

    private Long builderId;

    private String address;

    private String city;

    private Long totalBlocks;

    private LocalDateTime createdAt;
}
