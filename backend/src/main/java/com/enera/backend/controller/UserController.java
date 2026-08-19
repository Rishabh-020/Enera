package com.enera.backend.controller;

import com.enera.backend.dto.user.ChangePasswordRequest;
import com.enera.backend.dto.user.UserResponse;
import com.enera.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    @PatchMapping("/change-password")
    public ResponseEntity<Map<String,String>> changePassword(@Valid @RequestBody ChangePasswordRequest request){
        userService.changePassword(request);

        return ResponseEntity.ok(
                Map.of("message","password change successfully")
        );
    }
}
