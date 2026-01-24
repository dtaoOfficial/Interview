package com.dtao.resume.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List; // ✅ Import List

@Document(collection = "applications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Application {

    @Id
    private String id;

    private String jobId;          // Links to the Job Role
    private String candidateName;
    private String email;
    private String phone;
    private String comments;

    // ✅ File Paths (Stored as strings in DB)
    private String resumePath;
    private String videoPath;

    // ✅ NEW FIELD: Store the questions asked to this candidate
    private List<Question> askedQuestions;

    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, WAITLISTED

    @Builder.Default
    private LocalDateTime appliedAt = LocalDateTime.now();
}