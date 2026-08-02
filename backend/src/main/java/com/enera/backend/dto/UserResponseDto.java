package com.enera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponseDto {
    private Long id;

    private String name;

    private String email;

    private String role;

    private Long societyId;

    private Long flatId;
}
