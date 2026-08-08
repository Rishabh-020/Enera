package com.enera.backend.controller;

import com.enera.backend.dto.society.SocietyBlockResponse;
import com.enera.backend.dto.society.SocietyCommonAreaResponse;
import com.enera.backend.dto.society.SocietyFlatResponse;
import com.enera.backend.dto.society.SocietyOverviewResponse;
import com.enera.backend.service.SocietyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/society")
public class SocietyController {
    private final SocietyService societyService;

    SocietyController(SocietyService societyService){
        this.societyService = societyService;
    }

    @GetMapping("/{id}/overview")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<SocietyOverviewResponse> getSocietyOverview(@PathVariable Long id){
        return ResponseEntity.ok(
                societyService.getSocietyOverview(id)
        );
    }

    @GetMapping("/{id}/blocks")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<List<SocietyBlockResponse>> getSocietyBlocks(@PathVariable Long id){
        return ResponseEntity.ok(
                societyService.getSocietyBlocks(id)
        );
    }

    @GetMapping("/{id}/common_areas")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<List<SocietyCommonAreaResponse>> getSocietyCommonAreas(@PathVariable Long id){
        return ResponseEntity.ok(
                societyService.getSocietyCommonAreas(id)
        );
    }

    @GetMapping("/{id}/heatmap")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<double[][]> getSocietyHeatmap(@PathVariable Long id){
        return ResponseEntity.ok(
                societyService.getSocietyHeatmap(id)
        );
    }

    @GetMapping("/{id}/flats")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<List<SocietyFlatResponse>> getSocietyFlatHeatmap(@PathVariable Long id){
        return ResponseEntity.ok(
                societyService.getSocietyFlatResponse(id)
        );
    }


}
