// src/main/java/com/example/clinicappointmentsystem/repository/UserRepository.java
package com.example.clinicappointmentsystem.repository;

import com.example.clinicappointmentsystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data repository for {@link User} persistence operations.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Looks up a user by email, used to authenticate accounts during login.
     *
     * @param email the account email to search for
     * @return the matching user, if one exists
     */
    Optional<User> findByEmail(String email);
}
