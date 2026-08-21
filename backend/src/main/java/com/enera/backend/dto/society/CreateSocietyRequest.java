package com.enera.backend.dto.society;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateSocietyRequest {
    @NotBlank(message = "Society name is required")
    private String name;

    @NotNull(message = "Builder ID is required")
    private Long builderId;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotNull(message = "Total blocks is required")
    private Long totalBlocks;

    private String adminName;

    @Email(message = "Enter correct email format")
    @JsonAlias({"email", "adminEmail"})
    private String adminEmail;

    @Size(min = 8, message = "Password must contain at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&^#()_+\\-={}\\[\\]:;\"'<>,./~`|\\\\]).{8,}$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    )
    @JsonAlias({"password", "adminPassword"})
    private String adminPassword;
}
