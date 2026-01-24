package com.dtao.resume.controller;

import com.dtao.resume.model.Application;
import com.dtao.resume.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@RestController
@RequestMapping("/api/public/share") // ✅ Public Endpoint (No Token Required)
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class PublicController {

    private final ApplicationRepository applicationRepository;

    // 1. Get Application Details (JSON)
    @GetMapping("/{id}")
    public ResponseEntity<Application> getApplicationDetails(@PathVariable String id) {
        return applicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 2. Stream Video (Public)
    @GetMapping("/{id}/video")
    public ResponseEntity<Resource> getPublicVideo(@PathVariable String id) {
        return serveFile(id, "video");
    }

    // 3. Download Resume (Public)
    @GetMapping("/{id}/resume")
    public ResponseEntity<Resource> getPublicResume(@PathVariable String id) {
        return serveFile(id, "resume");
    }

    // ✅ Helper to serve files safely
    private ResponseEntity<Resource> serveFile(String appId, String type) {
        Optional<Application> appOpt = applicationRepository.findById(appId);

        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Application app = appOpt.get();
        String filePath = type.equals("resume") ? app.getResumePath() : app.getVideoPath();

        // 🛑 SAFETY CHECK: If file path is missing (e.g. Resume-Only app), return 404 instead of crashing
        if (filePath == null || filePath.trim().isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            Path path = Paths.get(filePath);
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Determine Content Type
                String contentType = "application/octet-stream";
                if (type.equals("resume")) {
                    contentType = "application/pdf";
                } else if (filePath.endsWith(".webm")) {
                    contentType = "video/webm";
                } else if (filePath.endsWith(".mp4")) {
                    contentType = "video/mp4";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}