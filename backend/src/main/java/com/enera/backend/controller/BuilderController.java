package com.enera.backend.controller;

import com.enera.backend.dto.block.CreateBlockRequest;
import com.enera.backend.dto.builder.BuilderOverviewResponse;
import com.enera.backend.dto.builder.BuilderSocietyResponse;
import com.enera.backend.dto.society.CreateSocietyRequest;
import com.enera.backend.dto.society.HourlyBreakDownResponse;
import com.enera.backend.dto.society.SocietyResponse;
import com.enera.backend.entity.Block;
import com.enera.backend.service.BlockService;
import com.enera.backend.service.BuilderService;
import com.enera.backend.service.SocietyService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/builder")
public class BuilderController {
    private final BuilderService builderService;
    private final SocietyService societyService;

    BuilderController(BuilderService builderService,
                      SocietyService societyService) {
        this.builderService = builderService;
        this.societyService = societyService;
    }

    @GetMapping("/{id}/overview")
    @PreAuthorize("hasAuthority('BUILDER_ADMIN')")
    public ResponseEntity<BuilderOverviewResponse> getBuilderOverview(@PathVariable Long id){
        return ResponseEntity.ok(
                builderService.getBuilderOverview(id)
        );
    }

    @GetMapping("/{id}/societies")
    @PreAuthorize("hasAuthority('BUILDER_ADMIN')")
    public ResponseEntity<List<BuilderSocietyResponse>> getBuilderSocieties(@PathVariable Long id){
        return ResponseEntity.ok(
                builderService.getBuilderSocieties(id)
        );
    }

    @GetMapping("/{id}/hourly-breakdown")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<List<HourlyBreakDownResponse>> getHourlyTrend(@PathVariable Long id,
                                                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date){
        return ResponseEntity.ok(
                builderService.getHourlyBreakDown(id,date)
        );
    }

    @PostMapping("/{id}/society")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<SocietyResponse> createSociety(@PathVariable Long id,@RequestBody CreateSocietyRequest request) {
        request.setBuilderId(id);
        return ResponseEntity.ok(
                societyService.createSociety(request)
        );
    }
}
