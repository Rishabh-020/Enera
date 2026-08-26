package com.enera.backend.controller;

import com.enera.backend.dto.block.BlockFloorResponse;
import com.enera.backend.dto.block.CreateBlockRequest;
import com.enera.backend.dto.floor.CreateFloorRequest;
import com.enera.backend.dto.floor.FloorResponse;
import com.enera.backend.entity.Block;
import com.enera.backend.entity.Flat;
import com.enera.backend.service.BlockService;
import com.enera.backend.service.FlatService;
import com.enera.backend.service.FloorService;
import jakarta.validation.Valid;
import org.springframework.data.jpa.repository.query.PreprocessedQuery;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/block")
public class BlockController {
    private final BlockService blockService;
    private final FloorService floorService;

    BlockController(BlockService blockService,
                    FloorService floorService){
        this.blockService = blockService;
        this.floorService = floorService;
    }

    @GetMapping("/{id}/floors")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<List<BlockFloorResponse>> getBlockFloors(@PathVariable Long id){
        return ResponseEntity.ok(
                blockService.getBlockFloors(id)
        );
    }

    @PostMapping("/{blockId}/floor")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<FloorResponse> createFloor(@PathVariable Long blockId,
                                                     @Valid @RequestBody CreateFloorRequest request){
        request.setBlockId(blockId);
        return ResponseEntity.ok(
                floorService.createFloor(blockId,request)
        );
    }

    @DeleteMapping("/{blockId}/floor/{floorId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<Void> deleteFloor(@PathVariable Long blockId, @PathVariable Long floorId){
        floorService.deleteFloor(floorId);
        return ResponseEntity.noContent().build();
    }
}