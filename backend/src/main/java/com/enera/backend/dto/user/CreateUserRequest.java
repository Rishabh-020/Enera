package com.enera.backend.dto.user;


import com.enera.backend.entity.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must contain at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&^#()_+\\-={}\\[\\]:;\"'<>,./~`|\\\\]).{8,}$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    )
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotNull(message = "Flat is required")
    private Long flatId;

    private Long builderId;

    @NotNull(message = "Block name is required")
    private String blockName;
}
