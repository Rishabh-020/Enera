package com.enera.backend.dto.builder;

import java.util.*;
import com.enera.backend.entity.Society;
import lombok.Data;

@Data
public class BuilderResponse {
    private Long id;

    private String email;

    private String name;

    private Integer totalSocieties;
}
