package com.enera.backend.controller;


import com.enera.backend.dto.FlatOwner.*;
import com.enera.backend.service.FlatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/flat")
public class FlatController {
    private final FlatService flatService;

    FlatController(FlatService flatService){
        this.flatService = flatService;
    }

    @GetMapping("/{id}/live")
    @PreAuthorize("hasAnyAuthority('RESIDENT','SOCIETY_ADMIN')")
    public ResponseEntity<FlatLiveResponse> getFlatLive(@PathVariable Long id){
        return ResponseEntity.ok(
                flatService.getFlatLive(id)
        );
    }

    @GetMapping("{id}/summary")
    @PreAuthorize("hasAnyAuthority('RESIDENT','SOCIETY_ADMIN')")
    public ResponseEntity<FlatSummaryResponse> getFlatSummary(@PathVariable Long id, @RequestParam String month){
        return ResponseEntity.ok(
                flatService.getFlatSummary(id,month)
        );
    }

    @GetMapping("{id}/trend")
    @PreAuthorize("hasAnyAuthority('RESIDENT','SOCIETY_ADMIN')")
    public ResponseEntity<FlatTrendResponse> getFlatTrend(@PathVariable Long id){
        return ResponseEntity.ok(
                flatService.getFlatTrend(id)
        );
    }

    @GetMapping("{id}/hourly-profile")
    @PreAuthorize("hasAnyAuthority('RESIDENT','SOCIETY_ADMIN')")
    public ResponseEntity<FlatHourlyProfileResponse> getFlatHourlyProfile(@PathVariable Long id){
        return ResponseEntity.ok(
                flatService.getFlatHourlyProfile(id)
        );
    }

    @GetMapping("{id}/details")
    @PreAuthorize("hasAnyAuthority('RESIDENT',SOCIETY_ADMIN'")
    public ResponseEntity<FlatDetailResponse> getFlatDetail(@PathVariable Long id){
        return ResponseEntity.ok(
            flatService.getFlatDetail(id)
        );
    }
}
