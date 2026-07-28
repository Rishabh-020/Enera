package com.enera.backend.dto;

import lombok.Data;
import lombok.extern.java.Log;

@Data
public class LoginRequest {
    private String password;
    private String email;
}
