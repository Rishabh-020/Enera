package com.enera.backend.controller;

import com.enera.backend.dto.superAdmin.BuilderListResponse;
import com.enera.backend.dto.superAdmin.SuperAdminOverviewResponse;
import com.enera.backend.service.SuperAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/superAdmin")
public class SuperAdminController {
    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
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

    @GetMapping("/dashboard")
    public String dashboard() {
        return "Super Admin Dashboard";
    }
}
