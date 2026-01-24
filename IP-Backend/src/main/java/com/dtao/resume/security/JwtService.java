package com.dtao.resume.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final String SECRET_KEY = "VeryStrongSecretKeyChangeThis123!"; // 🔐 Use env var in production

    // ✅ CHANGED TO 24 HOURS (1000ms * 60s * 60m * 24h)
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24;

    /**
     * ✅ Generate JWT Token
     */
    public String generateToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        return JWT.create()
                .withSubject(email)
                .withIssuedAt(new Date(System.currentTimeMillis()))
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .withClaim("role", "ADMIN")
                .sign(Algorithm.HMAC256(SECRET_KEY));
    }

    /**
     * ✅ Extract Username (Alias for extractEmail to match Spring Security naming)
     */
    public String extractUsername(String token) {
        return extractEmail(token);
    }

    /**
     * ✅ Extract email from token
     */
    public String extractEmail(String token) {
        return decodeToken(token).getSubject();
    }

    /**
     * ✅ Validate JWT Token (Overload for String email)
     */
    public boolean isTokenValid(String token, String userEmail) {
        try {
            String extractedEmail = extractEmail(token);
            return (extractedEmail.equals(userEmail) && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * ✅ Validate JWT Token (Overload for UserDetails - fixes your error!)
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return decodeToken(token).getExpiresAt().before(new Date());
    }

    private DecodedJWT decodeToken(String token) {
        return JWT.require(Algorithm.HMAC256(SECRET_KEY))
                .build()
                .verify(token);
    }
}