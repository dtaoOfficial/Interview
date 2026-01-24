package com.dtao.resume.controller;

import com.dtao.resume.model.Role;
import com.dtao.resume.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api") // Changed base path to separate admin/public easily
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class RoleController {

    private final RoleService roleService;

    // ================= ADMIN ENDPOINTS =================

    /**
     * ✅ Admin: Create Role
     */
    @PostMapping("/admin/roles")
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        Role saved = roleService.createRole(role);
        return ResponseEntity.ok(saved);
    }

    /**
     * ✅ Admin: Get ALL roles (Active & Inactive)
     */
    @GetMapping("/admin/roles")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    /**
     * ✅ Admin: Update Role (Toggle Online/Offline & Video Req)
     */
    @PutMapping("/admin/roles/{id}")
    public ResponseEntity<Role> updateRole(@PathVariable String id, @RequestBody Role updatedRole) {
        return ResponseEntity.ok(roleService.updateRole(id, updatedRole));
    }

    /**
     * ✅ Admin: Delete Role
     */
    @DeleteMapping("/admin/roles/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable String id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/roles/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable String id) {
        return roleService.getRoleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ================= PUBLIC / CANDIDATE ENDPOINTS =================

    /**
     * ✅ Public: Get ONLY ACTIVE roles
     * Use this endpoint in your React JobBoard.tsx
     */
    @GetMapping("/public/roles")
    public ResponseEntity<List<Role>> getPublicRoles() {
        return ResponseEntity.ok(roleService.getPublicRoles());
    }
}