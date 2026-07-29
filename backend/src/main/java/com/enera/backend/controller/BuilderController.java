package com.enera.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/builder")
public class BuilderController {
    @GetMapping("/dashboard")
    public String dashboard(){
        return "Builder Dashboard";
    }
}
