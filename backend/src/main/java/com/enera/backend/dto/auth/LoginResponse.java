package com.enera.backend.dto.auth;

import com.enera.backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;

    private Long id;

    private String name;

    private String email;

    private Role role;

    private Long flatId;

    private Long societyId;

    private Long builderId;
}
