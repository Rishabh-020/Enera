package com.enera.backend.controller;

import com.enera.backend.dto.block.CreateBlockRequest;
import com.enera.backend.dto.device.RegisterDeviceRequest;
import com.enera.backend.dto.device.RegisterDeviceResponse;
import com.enera.backend.dto.society.*;
import com.enera.backend.dto.user.CreateUserRequest;
import com.enera.backend.entity.Block;
import com.enera.backend.entity.Role;
import com.enera.backend.service.BlockService;
import com.enera.backend.service.SocietyService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/society")
public class SocietyController {
    private final SocietyService societyService;
    private final BlockService blockService;

    SocietyController(SocietyService societyService,
                      BlockService blockService){
        this.societyService = societyService;
        this.blockService = blockService;
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

    @GetMapping("/{id}/daily-trend")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN','BUILDER_ADMIN')")
    public ResponseEntity<List<DailyTrendResponse>> getDailyTrend(@PathVariable Long id,
                                                                  @RequestParam(defaultValue = "7") int days){
        return ResponseEntity.ok(
                societyService.getDailyTrend(id,days)
        );
    }

    @GetMapping("/{id}/hourly-breakdown")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<List<HourlyBreakDownResponse>> getHourlyTrend(@PathVariable Long id,
@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date){
        return ResponseEntity.ok(
            societyService.getHourlyBreakDown(id,date)
        );
    }

    @GetMapping("/{id}/anomalies")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<List<SocietyAnomaliesResponse>> getAnomalies(@PathVariable Long id){
        return ResponseEntity.ok(
                societyService.getAnomalies(id)
        );
    }

    @PostMapping("/{id}/block")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'BUILDER_ADMIN','SOCIETY_ADMIN')")
    public ResponseEntity<Block> createBlock(@PathVariable Long id, @RequestBody CreateBlockRequest request) {
        request.setSocietyId(id);
        return ResponseEntity.ok(
                blockService.createBlock(request)
        );
    }

    @PostMapping("/{id}/resident")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','SOCIETY_ADMIN','BUILDER_ADMIN')")
    public ResponseEntity<RegisterResidentResponse> registerResident(@PathVariable Long id,
                                                                    @Valid @RequestBody CreateUserRequest request){
        request.setSocietyId(id);
        request.setRole(Role.RESIDENT);
        return ResponseEntity.ok(
                societyService.registerResident(request)
        );
    }
}
