package com.enera.backend.controller;

import com.enera.backend.dto.block.BlockFloorResponse;
import com.enera.backend.dto.block.CreateBlockRequest;
import com.enera.backend.entity.Block;
import com.enera.backend.service.BlockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/block")
public class BlockController {
    private final BlockService blockService;

    BlockController(BlockService blockService){
        this.blockService = blockService;
    }

    @GetMapping("/{id}/floors")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<List<BlockFloorResponse>> getBlockFloors(@PathVariable Long id){
        return ResponseEntity.ok(
                blockService.getBlockFloors(id)
        );
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<Block> createBlock(@RequestBody CreateBlockRequest request) {
        return ResponseEntity.ok(
                blockService.createBlock(request)
        );
    }
}