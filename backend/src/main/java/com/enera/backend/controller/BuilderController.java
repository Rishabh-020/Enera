package com.enera.backend.controller;

import com.enera.backend.dto.builder.BuilderOverviewResponse;
import com.enera.backend.dto.builder.BuilderSocietyResponse;
import com.enera.backend.service.BuilderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
