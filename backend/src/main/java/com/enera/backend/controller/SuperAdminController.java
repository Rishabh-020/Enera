package com.enera.backend.controller;

import com.enera.backend.dto.builder.CreateBuilderRequest;
import com.enera.backend.dto.superAdmin.BuilderListResponse;
import com.enera.backend.dto.superAdmin.SuperAdminOverviewResponse;
import com.enera.backend.entity.Builder;
import com.enera.backend.service.BuilderService;
import com.enera.backend.service.SuperAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/superAdmin")
public class SuperAdminController {
    private final SuperAdminService superAdminService;
    private final BuilderService builderService;

    public SuperAdminController(SuperAdminService superAdminService,
                                BuilderService builderService) {
        this.superAdminService = superAdminService;
        this.builderService = builderService;
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<SuperAdminOverviewResponse> getOverview() {
        return ResponseEntity.ok(superAdminService.getOverview());
    }

    @GetMapping("/builders")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<List<BuilderListResponse>> getBuilders() {
        return ResponseEntity.ok(superAdminService.getBuilders());
    }

    @PostMapping("/builders")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Builder> createBuilder(@RequestBody CreateBuilderRequest request) {
        return ResponseEntity.ok(
                builderService.createBuilder(request)
        );
    }
}
