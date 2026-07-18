// src/main/java/com/example/clinicappointmentsystem/security/CustomUserDetailsService.java
package com.example.clinicappointmentsystem.security;

import com.example.clinicappointmentsystem.model.User;
import com.example.clinicappointmentsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Loads {@link User} accounts for Spring Security, bridging the domain model
 * to Spring Security's {@link UserDetails} contract.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private static final String ROLE_PREFIX = "ROLE_";

    private final UserRepository userRepository;

    /**
     * Looks up a user by email and maps it to a {@link UserDetails}, with the
     * user's {@link User.Role} exposed as a single "ROLE_"-prefixed authority.
     *
     * @param email the email used as the authentication username
     * @return the corresponding Spring Security user
     * @throws UsernameNotFoundException if no user has that email
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user found with email: " + email));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities(new SimpleGrantedAuthority(ROLE_PREFIX + user.getRole().name()))
                .build();
    }
}
