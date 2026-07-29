package com.enera.backend.controller;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/flat")
public class FlatController {
    @GetMapping("/dashboard")
    public String dashboard(){
        return "Flat Owner Dashboard";
    }
}
