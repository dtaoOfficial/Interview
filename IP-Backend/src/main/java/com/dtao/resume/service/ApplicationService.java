package com.dtao.resume.service;

import com.dtao.resume.model.Application;
import com.dtao.resume.model.Question;
import com.dtao.resume.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final EmailService emailService; // ✅ Inject Email Service

    // ✅ Define the root upload directory (Works on Windows & Linux)
    private final String UPLOAD_DIR = System.getProperty("user.dir") + File.separator + "uploads";

    public Application saveApplication(
            String jobId,
            String name,
            String email,
            String phone,
            String comments,
            List<Question> askedQuestions,
            MultipartFile resumeFile,
            MultipartFile videoFile
    ) throws IOException {

        // 1. Create a unique folder for this applicant
        // Structure: uploads/jobId/email_timestamp/
        String uniqueFolder = email.replaceAll("[^a-zA-Z0-9]", "_") + "_" + System.currentTimeMillis();
        Path candidatePath = Paths.get(UPLOAD_DIR, jobId, uniqueFolder);

        // 2. Actually create the folders on the disk
        if (!Files.exists(candidatePath)) {
            Files.createDirectories(candidatePath);
        }

        // 3. Save Resume (Required)
        String resumeFileName = "resume_" + UUID.randomUUID() + ".pdf";
        Path resumeDest = candidatePath.resolve(resumeFileName);
        Files.copy(resumeFile.getInputStream(), resumeDest, StandardCopyOption.REPLACE_EXISTING);

        // 4. Save Video (OPTIONAL - Handle Null for Direct Submit)
        String savedVideoPath = null;

        if (videoFile != null && !videoFile.isEmpty()) {
            // ✅ Only try to save if video exists
            String videoFileName = "interview_" + UUID.randomUUID() + ".webm";
            Path videoDest = candidatePath.resolve(videoFileName);
            Files.copy(videoFile.getInputStream(), videoDest, StandardCopyOption.REPLACE_EXISTING);
            savedVideoPath = videoDest.toAbsolutePath().toString();
        }

        // 5. Save Metadata to MongoDB
        Application app = Application.builder()
                .jobId(jobId)
                .candidateName(name)
                .email(email)
                .phone(phone)
                .comments(comments)
                .resumePath(resumeDest.toAbsolutePath().toString()) // Save full path
                .videoPath(savedVideoPath)   // ✅ Can be null now
                .askedQuestions(askedQuestions)
                .status("PENDING") // ✅ Ensure status is set
                .build();

        Application savedApp = applicationRepository.save(app);

        // ✅ 6. TRIGGER EMAILS (Async-ish safe call)
        System.out.println("📧 Triggering Email Notifications...");

        // A. Send confirmation to Candidate
        emailService.sendCandidateSuccessEmail(savedApp.getEmail(), savedApp.getCandidateName(), savedApp.getJobId());

        // B. Send alert to HR
        emailService.sendHrAlertEmail(savedApp);

        return savedApp;
    }
}