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
@RequestMapping("/api/admin/files") // ✅ Protected: Only Admins can view files
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class FileController {

    private final ApplicationRepository applicationRepository;

    /**
     * ✅ View Resume PDF
     */
    @GetMapping("/{applicationId}/resume")
    public ResponseEntity<Resource> getResume(@PathVariable String applicationId) {
        return serveFile(applicationId, "resume");
    }

    /**
     * ✅ Play Video
     */
    @GetMapping("/{applicationId}/video")
    public ResponseEntity<Resource> getVideo(@PathVariable String applicationId) {
        return serveFile(applicationId, "video");
    }

    // Helper method to find file on disk and return it safely
    private ResponseEntity<Resource> serveFile(String appId, String type) {
        Optional<Application> appOpt = applicationRepository.findById(appId);

        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Application app = appOpt.get();
        String filePath = type.equals("resume") ? app.getResumePath() : app.getVideoPath();

        // 🛑 CRITICAL FIX: Check for NULL before creating Path
        // If it's a resume-only application, videoPath will be null.
        if (filePath == null || filePath.trim().isEmpty()) {
            // Return 404 safely instead of crashing with NullPointerException
            return ResponseEntity.notFound().build();
        }

        try {
            Path path = Paths.get(filePath);
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() && resource.isReadable()) {
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
            e.printStackTrace(); // Log error but don't crash server
            return ResponseEntity.internalServerError().build();
        }
    }
}