package com.dtao.resume.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Debug: Print the path being accessed
        // System.out.println("Processing Request: " + request.getRequestURI());

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // System.out.println("No Bearer Token found.");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            jwt = authHeader.substring(7);

            // NOTE: Ensure your JwtService uses 'extractUsername' if subject is email
            // or 'extractEmail' if you put email in a custom claim.
            // Standard is usually: userEmail = jwtService.extractUsername(jwt);
            userEmail = jwtService.extractUsername(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    // System.out.println("User Authenticated: " + userEmail);
                } else {
                    System.out.println("Token Invalid for user: " + userEmail);
                }
            }
        } catch (Exception e) {
            System.out.println("JWT Filter Error: " + e.getMessage());
            e.printStackTrace(); // This helps us see if Token is expired or malformed
        }

        filterChain.doFilter(request, response);
    }
}