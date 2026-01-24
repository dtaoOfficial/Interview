package com.dtao.resume.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "job_roles")
public class JobRole {

    @Id
    private String id;
    
    private String jobTitle;
    private String department;
    private String positionDetails; // Description
    
    // ✅ NEW FIELD: Controls if video interview is needed for this role
    // Default is 'true' so video is required by default.
    private Boolean videoRequired = true; 
}