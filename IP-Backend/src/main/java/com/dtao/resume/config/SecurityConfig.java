package com.dtao.resume.config;

import com.dtao.resume.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    // ✅ FIX: Inject Allowed Origins from application.properties (.env)
    @Value("#{'${app.cors.allowed-origins}'.split(',')}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ✅ 1. Allow Public Access to "Share Link" & Application Submission
                        .requestMatchers("/api/public/**").permitAll()
                        // ✅ 2. Allow Admin Login
                        .requestMatchers("/api/auth/**", "/api/admin/auth/**").permitAll()
                        // ✅ 3. Allow Candidates to VIEW Jobs & Questions (GET Only)
                        .requestMatchers(HttpMethod.GET, "/api/admin/roles").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/admin/questions/**").permitAll()
                        // ✅ 4. Swagger UI (Optional)
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // ✅ 5. Handle Pre-flight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 🔒 6. PROTECT EVERYTHING ELSE
                        .requestMatchers("/api/admin/**").authenticated()
                        // Default lock
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        // 1. Create empty provider
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        // 2. Set the UserDetailsService
        authProvider.setUserDetailsService(userDetailsService);

        // 3. Set the PasswordEncoder
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✅ FIX: Use the injected dynamic list from .env
        configuration.setAllowedOrigins(allowedOrigins);

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}