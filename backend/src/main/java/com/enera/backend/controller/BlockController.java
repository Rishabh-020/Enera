package com.enera.backend.controller;

import com.enera.backend.dto.block.BlockFlatsResponse;
import com.enera.backend.service.BlockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/block")
public class BlockController {
    private final BlockService blockService;

    BlockController(BlockService blockService){
        this.blockService = blockService;
    }

    @GetMapping("/{id}/flats")
    @PreAuthorize("hasAuthority('SOCIETY_ADMIN')")
    public ResponseEntity<List<BlockFlatsResponse>> getBlockFlats(@PathVariable Long id){
        return ResponseEntity.ok(
                blockService.getBlockFlats(id)
        );
    }
}