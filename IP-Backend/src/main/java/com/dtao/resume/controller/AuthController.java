package com.dtao.resume.controller;

import com.dtao.resume.model.Admin;
import com.dtao.resume.repository.AdminRepository;
import com.dtao.resume.security.JwtService;
import com.dtao.resume.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
// ✅ FIX: Read CORS origins dynamically from application.properties (linked to .env)
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AdminService adminService;
    private final AdminRepository adminRepository;

    /**
     * ✅ LOGIN ENDPOINT
     * POST /api/auth/login
     * Request: { "email": "admin@example.com", "password": "12345678" }
     * Response: { "token": "<JWT_TOKEN>", "email": "admin@example.com" }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Admin loginRequest) {
        try {
            // Authenticate using Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            // If authentication succeeds, generate JWT
            String token = jwtService.generateToken(loginRequest.getEmail());

            return ResponseEntity.ok().body(
                    new LoginResponse(loginRequest.getEmail(), token, "Login successful")
            );

        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }

    /**
     * ✅ REGISTER ADMIN (Optional for first setup)
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Admin admin) {
        if (adminRepository.existsByEmail(admin.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        Admin savedAdmin = adminService.createAdmin(admin);
        return ResponseEntity.ok(savedAdmin);
    }

    // ✅ Response DTO (inner class)
    private record LoginResponse(String email, String token, String message) {}
}