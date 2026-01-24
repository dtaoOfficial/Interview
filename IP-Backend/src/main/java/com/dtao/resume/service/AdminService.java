package com.dtao.resume.service;

import com.dtao.resume.model.Admin;
import com.dtao.resume.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * ✅ Find admin by email
     */
    public Optional<Admin> findByEmail(String email) {
        return adminRepository.findByEmail(email);
    }

    /**
     * ✅ Validate admin credentials
     */
    public boolean validateCredentials(String email, String rawPassword) {
        Optional<Admin> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isEmpty()) return false;

        Admin admin = adminOpt.get();
        return passwordEncoder.matches(rawPassword, admin.getPassword());
    }

    /**
     * ✅ Create new admin (optional — for seeding or registration)
     */
    public Admin createAdmin(Admin admin) {
        if (adminRepository.existsByEmail(admin.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        admin.setPassword(passwordEncoder.encode(admin.getPassword()));
        return adminRepository.save(admin);
    }
}
