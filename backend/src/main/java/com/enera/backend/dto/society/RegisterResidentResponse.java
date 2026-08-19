package com.enera.backend.dto.society;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterResidentResponse {
    private Long id;

    private String name;
    
    private String email;
    
    private String role;
    
    private Long flatId;
    
    private Long societyId;
}
