package com.dtao.resume.repository;

import com.dtao.resume.model.Question;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends MongoRepository<Question, String> {

    // ✅ Find all questions for a specific role
    List<Question> findByRoleId(String roleId);

    // ✅ Delete all questions for a specific role (optional cleanup)
    void deleteByRoleId(String roleId);
}
