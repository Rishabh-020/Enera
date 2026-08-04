package com.enera.backend.dto.block;

import com.enera.backend.entity.Society;
import lombok.Data;

@Data
public class BlockResponse {
    private Long blockId;

    private Long societyId;

    private Society societyName;

    private String blockName;
}
