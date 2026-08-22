package com.enera.backend.controller;

import com.enera.backend.dto.FlatOwner.CreateFlatRequest;
import com.enera.backend.dto.FlatOwner.FlatResponse;
import com.enera.backend.dto.floor.FloorFlatResponse;
import com.enera.backend.service.FlatService;
import com.enera.backend.service.FloorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/floor")
public class FloorController {
    private final FloorService floorService;
    private final FlatService flatService;

    FloorController(FloorService floorService,
                    FlatService flatService){
        this.floorService = floorService;
        this.flatService = flatService;
    }

    @GetMapping("/{id}/flats")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<List<FloorFlatResponse>> getFloorFlats(@PathVariable Long id){
        return ResponseEntity.ok(
                floorService.getFloorFlats(id)
        );
    }

    @PostMapping("/{id}/flat")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<FlatResponse> createFlat(@PathVariable Long id, @Valid @RequestBody CreateFlatRequest request){
        return ResponseEntity.ok(
               flatService.createFlat(id,request)
        );
    }

    @DeleteMapping("/{floorId}/flat/{flatId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'BUILDER_ADMIN', 'SOCIETY_ADMIN')")
    public ResponseEntity<Void> deleteFlat(@PathVariable Long floorId, @PathVariable Long flatId){
        flatService.deleteFlat(flatId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'BUILDER_ADMIN', 'SOCIETY_ADMIN')")
    public ResponseEntity<Void> deleteFloor(@PathVariable Long id){
        floorService.deleteFloor(id);
        return ResponseEntity.noContent().build();
    }
}
