package com.enera.backend.controller;

import com.enera.backend.dto.floor.FloorFlatResponse;
import com.enera.backend.repository.FloorRepository;
import com.enera.backend.service.FloorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/floor")
public class FloorController {
    private final FloorService floorService;

    FloorController(FloorService floorService){
        this.floorService = floorService;
    }

    @GetMapping("/{id}/flats")
    @PreAuthorize("Authorized('SOCIETY_ADMIN')")
    public ResponseEntity<List<FloorFlatResponse>> getFloorFlats(@PathVariable Long id){
        return ResponseEntity.ok(
                floorService.getFloorFlats(id)
        );
    }

}
