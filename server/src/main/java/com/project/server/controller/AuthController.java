package com.project.server.controller;

import com.project.server.dto.LoginRequest;
import com.project.server.dto.RegisterRequest;
import com.project.server.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public Map<String, Object> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        return authService.register(request);
    }

    @PostMapping("/login")
    public Map<String, Object> login(
            @Valid @RequestBody LoginRequest request
    ) {

        return authService.login(request);
    }

    @PostMapping("/logout")
    public Map<String, Object> logout() {

        return Map.of("ok", true);
    }
}