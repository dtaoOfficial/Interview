package com.dtao.resume.security;

import com.dtao.resume.model.Admin;
import com.dtao.resume.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService; // ✅ Import Interface
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService { // ✅ MUST IMPLEMENT THIS

    private final AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found with email: " + email));

        // Fix potential null role issue
        String role = (admin.getRole() == null || admin.getRole().isEmpty()) ? "ADMIN" : admin.getRole();

        return User.builder()
                .username(admin.getEmail())
                .password(admin.getPassword())
                .roles(role) // Ensures roles are set
                .build();
    }
}