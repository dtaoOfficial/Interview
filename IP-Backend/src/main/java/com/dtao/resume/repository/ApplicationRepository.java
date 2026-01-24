package com.dtao.resume.repository;

import com.dtao.resume.model.Application;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApplicationRepository extends MongoRepository<Application, String> {
    List<Application> findByJobId(String jobId);
    List<Application> findByEmail(String email);
}