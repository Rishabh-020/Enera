package com.enera.backend.controller;

import com.enera.backend.dto.society.SocietyBlockResponse;
import com.enera.backend.dto.society.SocietyCommonAreaResponse;
import com.enera.backend.dto.society.SocietyFlatResponse;
import com.enera.backend.dto.society.SocietyOverviewResponse;
import com.enera.backend.mock.DemoDevice;
import com.enera.backend.mock.DemoReadingService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/demo")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true", matchIfMissing = true)
public class DemoController {

    private final DemoReadingService demoReadingService;

    @GetMapping("/society/{id}/overview")
    public SocietyOverviewResponse getSocietyOverview(@PathVariable("id") Long societyId) {
        return demoReadingService.getSocietyOverview(societyId);
    }

    @GetMapping("/society/{id}/blocks")
    public List<SocietyBlockResponse> getSocietyBlocks(@PathVariable("id") Long societyId) {
        return demoReadingService.getSocietyBlocks(societyId);
    }

    @GetMapping("/society/{id}/common_areas")
    public List<SocietyCommonAreaResponse> getSocietyCommonAreas(@PathVariable("id") Long societyId) {
        return demoReadingService.getSocietyCommonAreas(societyId);
    }

    @GetMapping("/society/{id}/flats")
    public List<SocietyFlatResponse> getSocietyFlats(@PathVariable("id") Long societyId) {
        return demoReadingService.getSocietyFlats(societyId);
    }

    @GetMapping("/devices")
    public List<DemoDevice> getAllDevices() {
        return demoReadingService.getAllDevices();
    }
}
