package com.dtao.resume.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import com.dtao.resume.model.Admin;

@Repository
public interface AdminRepository extends MongoRepository<Admin, String> {

    // ✅ Find admin by email (used for authentication)
    Optional<Admin> findByEmail(String email);

    // ✅ Check if an email already exists (used when adding new admins later)
    boolean existsByEmail(String email);
}
