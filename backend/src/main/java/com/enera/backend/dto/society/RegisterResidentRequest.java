package com.enera.backend.dto.society;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterResidentRequest {
    @NotNull(message = "FlatId can not be null")
    private Long flatId;

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Enter correct email format")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must contain at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&^#()_+\\-={}\\[\\]:;\"'<>,./~`|\\\\]).{8,}$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    )
    private String password;
}
