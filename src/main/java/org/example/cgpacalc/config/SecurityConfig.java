package org.example.cgpacalc.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * After Google OAuth succeeds, Spring redirects here.
     * We redirect to the Vite dev frontend so it can call /me and bootstrap the session.
     */
    @Bean
    public AuthenticationSuccessHandler oauthSuccessHandler() {
        return (request, response, authentication) -> {
            // In dev, Vite runs on 5173. In production, same origin — just redirect to "/"
            String redirectUrl = "http://localhost:5173/oauth-callback";
            response.sendRedirect(redirectUrl);
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // Public: OAuth redirect URIs, static assets, error page
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/app.js",
                    "/styles.css",
                    "/favicon.ico",
                    "/error",
                    "/login",
                    "/oauth2/**",
                    "/v3/api-docs/**",
                    "/swagger-ui/**"
                ).permitAll()
                // Protect all API routes — must be authenticated
                .requestMatchers("/me", "/users/**", "/createUser").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .oauth2Login(oauth -> oauth
                .successHandler(oauthSuccessHandler())
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("http://localhost:5173")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            );

        return http.build();
    }
}
