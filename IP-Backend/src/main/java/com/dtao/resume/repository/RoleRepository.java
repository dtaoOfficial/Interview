package com.dtao.resume.repository;

import com.dtao.resume.model.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoleRepository extends MongoRepository<Role, String> {
    boolean existsByJobTitle(String jobTitle);

    // ✅ NEW: Fetch only roles that are switched "ON" (Active)
    List<Role> findByIsActiveTrue();
}