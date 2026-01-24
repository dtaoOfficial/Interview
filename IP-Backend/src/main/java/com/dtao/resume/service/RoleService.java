package com.dtao.resume.service;

import com.dtao.resume.model.Role;
import com.dtao.resume.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    /**
     * ✅ Create new role
     */
    public Role createRole(Role role) {
        if (roleRepository.existsByJobTitle(role.getJobTitle())) {
            throw new RuntimeException("Role already exists with title: " + role.getJobTitle());
        }
        // Defaults are handled by Lombok @Builder.Default, but safe check:
        if (role.getIsActive() == null) role.setIsActive(true);
        if (role.getVideoRequired() == null) role.setVideoRequired(true);

        return roleRepository.save(role);
    }

    /**
     * ✅ Get ALL roles (For Admin Portal - shows both Active & Inactive)
     */
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    /**
     * ✅ Get ONLY ACTIVE roles (For Candidate Job Board)
     */
    public List<Role> getPublicRoles() {
        return roleRepository.findByIsActiveTrue();
    }

    /**
     * ✅ Get role by ID
     */
    public Optional<Role> getRoleById(String id) {
        return roleRepository.findById(id);
    }

    /**
     * ✅ Update existing role (Includes Toggles)
     */
    public Role updateRole(String id, Role updatedRole) {
        Role existing = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with ID: " + id));

        existing.setJobTitle(updatedRole.getJobTitle());
        existing.setDepartment(updatedRole.getDepartment());
        existing.setPositionDetails(updatedRole.getPositionDetails());

        // ✅ Update Toggles
        if (updatedRole.getIsActive() != null) {
            existing.setIsActive(updatedRole.getIsActive());
        }
        if (updatedRole.getVideoRequired() != null) {
            existing.setVideoRequired(updatedRole.getVideoRequired());
        }

        return roleRepository.save(existing);
    }

    /**
     * ✅ Delete role
     */
    public void deleteRole(String id) {
        roleRepository.deleteById(id);
    }
}