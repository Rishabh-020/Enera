package com.enera.backend.controller;

import com.enera.backend.config.DemoUserInitializer;
import com.enera.backend.dto.auth.LoginRequest;
import com.enera.backend.dto.auth.LoginResponse;
import com.enera.backend.entity.User;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.UserRepository;
import com.enera.backend.security.JwtService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final DemoUserInitializer demoUserInitializer;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UserDetailsService userDetailsService,
                          UserRepository userRepository,
                          DemoUserInitializer demoUserInitializer) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.demoUserInitializer = demoUserInitializer;
    }

    @PostMapping("/demo-login")
    public LoginResponse demoLogin() {
        demoUserInitializer.ensureDemoSeeded();
        LoginRequest req = new LoginRequest();
        req.setEmail("demoOwner@enera.com");
        req.setPassword("demoOwner@owner2007");
        return login(req);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        if (request.getEmail() != null && request.getEmail().toLowerCase().startsWith("demo")) {
            demoUserInitializer.ensureDemoSeeded();
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        String token = jwtService.generateToken(userDetails);

        Long societyId = user.getSociety() != null ? user.getSociety().getId() : null;
        Long builderId = user.getBuilder() != null ? user.getBuilder().getId() : null;
        Long flatId = user.getFlat() != null ? user.getFlat().getId() : null;

        return new LoginResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                flatId,
                societyId,
                builderId
        );
    }
}

