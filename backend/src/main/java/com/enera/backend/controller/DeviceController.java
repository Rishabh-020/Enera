package com.enera.backend.controller;

import com.enera.backend.service.DeviceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/device")
public class DeviceController {
    private final DeviceService deviceService;

    DeviceController(DeviceService deviceService){
        this.deviceService = deviceService;
    }

    @DeleteMapping("{id}")
    @PreAuthorize("hasAnyAuthority('SOCIETY_ADMIN', 'BUILDER_ADMIN')")
    public ResponseEntity<Map<String,String>> deRegisterDevice(@PathVariable Long id){
        deviceService.deRegisterDevice(id);

        return ResponseEntity.ok(
                Map.of("message", "Device deregistered successfully")
        );
    }


}