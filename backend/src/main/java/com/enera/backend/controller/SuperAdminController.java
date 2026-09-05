package com.enera.backend.controller;

import com.enera.backend.dto.builder.CreateBuilderRequest;
import com.enera.backend.dto.society.CreateSocietyRequest;
import com.enera.backend.dto.society.SocietyResponse;
import com.enera.backend.dto.superAdmin.BuilderListResponse;
import com.enera.backend.dto.superAdmin.SuperAdminOverviewResponse;
import com.enera.backend.entity.Builder;
import com.enera.backend.service.BuilderService;
import com.enera.backend.service.SocietyService;
import com.enera.backend.service.SuperAdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/superAdmin")
public class SuperAdminController {
    private final SuperAdminService superAdminService;
    private final BuilderService builderService;
    private final SocietyService societyService;

    public SuperAdminController(SuperAdminService superAdminService,
                                BuilderService builderService,
                                SocietyService societyService) {
        this.superAdminService = superAdminService;
        this.builderService = builderService;
        this.societyService = societyService;
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

    @PostMapping("/societies")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<SocietyResponse> createSociety(@Valid @RequestBody CreateSocietyRequest request) {
        return ResponseEntity.ok(
                societyService.createSociety(request)
        );
    }

    @DeleteMapping("/builders/{builderId}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteBuilder(@PathVariable Long builderId){
        builderService.deleteBuilder(builderId);
        return ResponseEntity.noContent().build();
    }
}
