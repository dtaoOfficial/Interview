package com.dtao.resume.service;

import com.dtao.resume.model.Question;
import com.dtao.resume.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;

    /**
     * ✅ Add a new question to a role
     */
    public Question addQuestion(Question question) {
        return questionRepository.save(question);
    }

    /**
     * ✅ Get all questions for a specific role
     */
    public List<Question> getQuestionsByRole(String roleId) {
        return questionRepository.findByRoleId(roleId);
    }

    /**
     * ✅ Update existing question
     */
    public Question updateQuestion(String id, Question updated) {
        Question existing = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found with ID: " + id));

        // ✅ FIXED: Use getText() and setText()
        existing.setText(updated.getText());
        existing.setDuration(updated.getDuration());

        return questionRepository.save(existing);
    }

    /**
     * ✅ Delete question by ID
     */
    public void deleteQuestion(String id) {
        questionRepository.deleteById(id);
    }

    /**
     * ✅ Delete all questions for a specific role
     */
    public void deleteQuestionsByRole(String roleId) {
        questionRepository.deleteByRoleId(roleId);
    }
}