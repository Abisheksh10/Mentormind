package com.project.server.repository;

import com.project.server.entity.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ProfileRepository
        extends MongoRepository<Profile, String> {

    Optional<Profile> findByUserId(String userId);
}