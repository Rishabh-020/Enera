package com.enera.backend.controller;

import com.enera.backend.dto.builder.BuilderOverviewResponse;
import com.enera.backend.dto.builder.BuilderSocietyResponse;
import com.enera.backend.dto.builder.CreateBuilderRequest;
import com.enera.backend.dto.society.HourlyBreakDownResponse;
import com.enera.backend.entity.Builder;
import com.enera.backend.service.BuilderService;
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

    BuilderController(BuilderService builderService){
        this.builderService = builderService;
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

    @PostMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Builder> createBuilder(@RequestBody CreateBuilderRequest request) {
        return ResponseEntity.ok(
                builderService.createBuilder(request)
        );
    }
}
