package com.dtao.resume.config;

import com.dtao.resume.model.Admin;
import com.dtao.resume.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        String defaultEmail = "imsingle8688@gmail.com";

        if (adminRepository.findByEmail(defaultEmail).isEmpty()) {
            Admin defaultAdmin = Admin.builder()
                    .username("Mahesh DTAO")
                    .email(defaultEmail)
                    .password(passwordEncoder.encode("Mahesh@8688"))
                    .role("ADMIN")
                    .build();

            adminRepository.save(defaultAdmin);
            System.out.println("✅ Default admin created successfully:");
            System.out.println("   Email: " + defaultEmail);
            System.out.println("   Password: Mahesh@8688");
        } else {
            System.out.println("ℹ️ Default admin already exists. Skipping creation.");
        }
    }
}
