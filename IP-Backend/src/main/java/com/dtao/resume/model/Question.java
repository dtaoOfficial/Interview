package com.dtao.resume.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;

@Document(collection = "questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    private String id;

    private String roleId;

    // ✅ CHANGED 'questionText' to 'text' to match Frontend
    private String text;

    private int duration;
}