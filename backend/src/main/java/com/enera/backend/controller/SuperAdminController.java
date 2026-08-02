package com.enera.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/superAdmin")
public class SuperAdminController {
    @GetMapping("/dashboard")
    public String dashboard(){
        return "Super Admin Dashboard";
    }
}
