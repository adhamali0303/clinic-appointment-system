// src/main/java/com/example/clinicappointmentsystem/service/AuthService.java
package com.example.clinicappointmentsystem.service;

import com.example.clinicappointmentsystem.dto.AuthResponse;
import com.example.clinicappointmentsystem.dto.LoginRequest;
import com.example.clinicappointmentsystem.dto.RegisterRequest;
import com.example.clinicappointmentsystem.model.User;
import com.example.clinicappointmentsystem.repository.UserRepository;
import com.example.clinicappointmentsystem.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Handles account registration and login, issuing JWTs on success.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    /**
     * Creates a new user account with a hashed password and returns a JWT for it.
     *
     * @param request the new account's details
     * @return a token and identity for the newly created account
     * @throws IllegalArgumentException if the email is already registered
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + request.email());
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(request.role())
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser);
        return new AuthResponse(token, savedUser.getEmail(), savedUser.getRole().name());
    }

    /**
     * Verifies login credentials via the {@link AuthenticationManager} and returns
     * a fresh JWT. Authentication failures are left to propagate as-is.
     *
     * @param request the login credentials
     * @return a token and identity for the authenticated account
     */
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + request.email()));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }
}
