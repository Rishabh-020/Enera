package com.enera.backend.service;

import com.enera.backend.dto.user.ChangePasswordRequest;
import com.enera.backend.dto.user.UserResponse;
import com.enera.backend.entity.User;
import com.enera.backend.exception.BadRequestException;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;


@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    UserService(UserRepository userRepository,
                PasswordEncoder passwordEncoder){
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getSociety() != null ? user.getSociety().getId() : null,
                user.getFlat() != null ? user.getFlat().getId() : null
        );
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(()-> new UserNotFoundException("User do not exits"));

        if(!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())){
            throw new BadRequestException("Current password do not match the old one");
        }

        if(!request.getNewPassword().equals(request.getConfirmPassword())){
            throw new BadRequestException("New password and confirm password do not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getConfirmPassword()));

        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId){
//        User user = userRepository.findByEmail()
    }
}
