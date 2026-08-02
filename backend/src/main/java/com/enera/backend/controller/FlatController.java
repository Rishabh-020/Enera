package com.enera.backend.controller;


import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/flat")
public class FlatController {
    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('RESIDENT')")
    public Map<String,String> dashboard(){
        return Map.of(
                "message" , "Welcome to the dashboard",
                "role" ,"RESIDENT"
        );
    }
}
