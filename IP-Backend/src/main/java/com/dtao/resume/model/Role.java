package com.dtao.resume.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;

@Document(collection = "roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    private String id;

    private String jobTitle;
    private String department;
    private String positionDetails;

    // ✅ FEATURE 1: Online/Offline Toggle
    // If false, this role will NOT show on the Candidate Job Board.
    @Builder.Default
    private Boolean isActive = true;

    // ✅ FEATURE 2: Video Interview Requirement
    // If false, candidates can submit without recording a video.
    @Builder.Default
    private Boolean videoRequired = true;
}