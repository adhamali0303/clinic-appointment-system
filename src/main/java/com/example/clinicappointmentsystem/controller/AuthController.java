// src/main/java/com/example/clinicappointmentsystem/controller/AuthController.java
package com.example.clinicappointmentsystem.controller;

import com.example.clinicappointmentsystem.dto.AuthResponse;
import com.example.clinicappointmentsystem.dto.LoginRequest;
import com.example.clinicappointmentsystem.dto.RegisterRequest;
import com.example.clinicappointmentsystem.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes registration and login endpoints for obtaining a JWT.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Registers a new account and returns a JWT for immediate use.
     *
     * @param request the new account's details
     * @return 201 with the issued token and account identity
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Authenticates an existing account and returns a fresh JWT.
     *
     * @param request the login credentials
     * @return 200 with the issued token and account identity
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
