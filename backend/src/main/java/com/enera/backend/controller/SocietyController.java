package com.enera.backend.controller;

import com.enera.backend.dto.device.RegisterDeviceRequest;
import com.enera.backend.dto.device.RegisterDeviceResponse;
import com.enera.backend.dto.society.*;
import com.enera.backend.service.SocietyService;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{id}/devices")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN','BUILDER_ADMIN')")
    public ResponseEntity<List<SocietyDeviceResponse>> getSocietyDevice(@PathVariable Long id){
        return ResponseEntity.ok(
                societyService.getSocietyDevice(id)
        );
    }

    @PostMapping("/{id}/register-device")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN','BUILDER_ADMIN')")
    public ResponseEntity<RegisterDeviceResponse> SocietyDeviceRegister(
            @PathVariable Long id, @RequestBody RegisterDeviceRequest request){
        return ResponseEntity.ok(
                societyService.registerDevice(id,request)
        );

    }
}
