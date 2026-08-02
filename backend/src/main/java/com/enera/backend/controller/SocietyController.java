package com.enera.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/society")
public class SocietyController {
    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('SOCIETY_ADMIN')")
    public Map<String,String> dashboard(){
        return Map.of(
                "message","Welcome to Dashboard",
                "role","SOCIETY_ADMIN"
        );
    }
}
