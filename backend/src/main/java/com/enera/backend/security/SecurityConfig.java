package com.enera.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
    CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder  passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager
            (AuthenticationConfiguration configuration)  throws Exception{
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/ws/energy", "/ws/energy/**").permitAll()
                        .requestMatchers("/reading/**").permitAll()

                        .requestMatchers("/superAdmin/**")
                        .hasAuthority("SUPER_ADMIN")

                        .requestMatchers("/builder/**")
                        .hasAnyAuthority("SUPER_ADMIN", "BUILDER_ADMIN")

                        .requestMatchers("/society/**")
                        .hasAnyAuthority("SUPER_ADMIN", "SOCIETY_ADMIN", "BUILDER_ADMIN")

                        .requestMatchers("/block/**")
                        .hasAnyAuthority("SUPER_ADMIN", "SOCIETY_ADMIN", "BUILDER_ADMIN")

                        .requestMatchers("/floor/**")
                        .hasAnyAuthority("SUPER_ADMIN", "SOCIETY_ADMIN", "BUILDER_ADMIN")

                        .requestMatchers("/flat/**")
                        .hasAnyAuthority("RESIDENT", "SOCIETY_ADMIN", "BUILDER_ADMIN", "SUPER_ADMIN")

                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
