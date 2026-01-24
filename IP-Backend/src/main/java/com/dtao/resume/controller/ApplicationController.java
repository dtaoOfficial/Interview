package com.dtao.resume.controller;

import com.dtao.resume.model.Application;
import com.dtao.resume.model.Question;
import com.dtao.resume.service.ApplicationService;
import com.dtao.resume.repository.ApplicationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
// ✅ FIX: Read CORS origins from application.properties (which reads .env)
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final ApplicationRepository applicationRepository;

    /**
     * ✅ Public: Submit Application
     * Path: /api/public/apply
     * Trigger: Saves Files -> Saves DB -> Sends Emails (Candidate + HR)
     */
    @PostMapping(value = "/public/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitApplication(
            @RequestParam("jobId") String jobId,
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam(value = "comments", required = false) String comments,
            @RequestParam(value = "questions", required = false) String questionsJson,
            @RequestParam("resume") MultipartFile resume,
            // ✅ Video is optional (null if "Direct Submit")
            @RequestParam(value = "video", required = false) MultipartFile video
    ) {
        try {
            // 1. Parse Questions JSON (if present)
            List<Question> askedQuestions = null;
            if (questionsJson != null && !questionsJson.isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                try {
                    askedQuestions = mapper.readValue(questionsJson, new TypeReference<List<Question>>(){});
                } catch (Exception e) {
                    System.err.println("⚠️ Warning: Could not parse questions JSON. Proceeding without questions.");
                }
            }

            // 2. Call Service
            // This method in Service now handles:
            // a) File Storage (uploads folder)
            // b) Database Entry (MongoDB)
            // c) SENDING EMAILS (Brevo)
            Application savedApp = applicationService.saveApplication(
                    jobId, name, email, phone, comments, askedQuestions, resume, video
            );

            return ResponseEntity.ok(savedApp);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error saving files: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error submitting application: " + e.getMessage());
        }
    }

    /**
     * ✅ Admin Only: Get All Applications
     * Path: /api/admin/applications
     */
    @GetMapping("/admin/applications")
    public ResponseEntity<List<Application>> getAllApplications() {
        return ResponseEntity.ok(applicationRepository.findAll());
    }

    /**
     * ✅ Admin Only: Update Application Status
     * Path: PUT /api/admin/applications/{id}/status
     */
    @PutMapping("/admin/applications/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");

        return applicationRepository.findById(id).map(app -> {
            app.setStatus(newStatus);
            applicationRepository.save(app);
            return ResponseEntity.ok(app);
        }).orElse(ResponseEntity.notFound().build());
    }
}