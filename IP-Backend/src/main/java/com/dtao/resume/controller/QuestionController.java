package com.dtao.resume.controller;

import com.dtao.resume.model.Question;
import com.dtao.resume.service.QuestionService;
import com.dtao.resume.util.EncryptionUtil; // ✅ Import Encryption Utility
import com.fasterxml.jackson.databind.ObjectMapper; // ✅ Import Jackson
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/questions")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class QuestionController {

    private final QuestionService questionService;

    /**
     * ✅ Add new question for a role
     */
    @PostMapping
    public ResponseEntity<Question> addQuestion(@RequestBody Question question) {
        Question saved = questionService.addQuestion(question);
        return ResponseEntity.ok(saved);
    }

    /**
     * ✅ Get questions by role ID (ENCRYPTED)
     * This prevents users from seeing questions in the Network Tab.
     */
    @GetMapping
    public ResponseEntity<String> getQuestionsByRole(@RequestParam String roleId) {
        List<Question> questions = questionService.getQuestionsByRole(roleId);

        try {
            // 1. Convert List -> JSON String
            ObjectMapper mapper = new ObjectMapper();
            String jsonString = mapper.writeValueAsString(questions);

            // 2. Encrypt the JSON String
            String encryptedData = EncryptionUtil.encrypt(jsonString);

            // 3. Return the scrambled text (e.g. "U2FsdGVkX1...")
            return ResponseEntity.ok(encryptedData);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error encrypting data");
        }
    }

    /**
     * ✅ Update question by ID
     */
    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(@PathVariable String id, @RequestBody Question updated) {
        Question saved = questionService.updateQuestion(id, updated);
        return ResponseEntity.ok(saved);
    }

    /**
     * ✅ Delete question by ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable String id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * ✅ Delete all questions for a role
     */
    @DeleteMapping("/role/{roleId}")
    public ResponseEntity<Void> deleteQuestionsByRole(@PathVariable String roleId) {
        questionService.deleteQuestionsByRole(roleId);
        return ResponseEntity.noContent().build();
    }
}