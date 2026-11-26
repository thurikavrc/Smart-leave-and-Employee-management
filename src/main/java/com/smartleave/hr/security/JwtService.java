package com.smartleave.hr.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${app.jwt.secret:}")
    private String configuredSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        if (configuredSecret != null && !configuredSecret.isBlank()) {
            byte[] keyBytes = Decoders.BASE64.decode(configuredSecret.trim());
            this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        } else {
            // Ephemeral cryptographically strong runtime key when JWT_SECRET is not supplied
            byte[] randomBytes = new byte[32];
            new SecureRandom().nextBytes(randomBytes);
            this.signingKey = Keys.hmacShaKeyFor(randomBytes);
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails, Map<String, Object> extraClaims) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(now))
                .expiration(new Date(now + jwtExpirationMs))
                .signWith(signingKey)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        Date expiration = extractClaim(token, Claims::getExpiration);
        return username.equalsIgnoreCase(userDetails.getUsername()) && expiration.after(new Date());
    }
}
