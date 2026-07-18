// src/main/java/com/example/clinicappointmentsystem/security/JwtService.java
package com.example.clinicappointmentsystem.security;

import com.example.clinicappointmentsystem.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Generates and validates JWT access tokens used to authenticate API requests.
 */
@Service
public class JwtService {

    private static final String ROLE_CLAIM = "role";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    /**
     * Builds a signed JWT for the given user, with the email as subject
     * and the role stored as a custom claim.
     *
     * @param user the authenticated user to issue a token for
     * @return a compact, signed JWT string
     */
    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim(ROLE_CLAIM, user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts the email (subject) encoded in the given token.
     *
     * @param token the JWT to read
     * @return the email the token was issued for
     */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Checks that a token is well-formed, unexpired, and issued for the given user.
     *
     * @param token       the JWT to validate
     * @param userDetails the user the token is expected to belong to
     * @return true if the token is valid for that user
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
