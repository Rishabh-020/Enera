package com.enera.backend.controller;

import com.enera.backend.dto.user.UserResponse;
import com.enera.backend.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserController {
    private  final UserService userService;

    public UserController(UserService userService){
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse useCurrentUser(){
        return userService.getCurrentUser();
    }
}
