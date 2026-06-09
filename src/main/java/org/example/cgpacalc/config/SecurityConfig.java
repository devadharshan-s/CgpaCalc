package org.example.cgpacalc.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.ProfileDTO;
import org.example.cgpacalc.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private final UserService userService;

    @Bean
    public AuthenticationSuccessHandler oauthSuccessHandler() {
        return new AuthenticationSuccessHandler() {
            @Override
            public void onAuthenticationSuccess(HttpServletRequest request,
                                                HttpServletResponse response,
                                                Authentication authentication) throws IOException {

                OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
                String email = oauthUser.getAttribute("email");
                String name  = oauthUser.getAttribute("name");

                // Auto-create or fetch the user profile
                ProfileDTO profile = userService.createUser(name, email);

                // Encode profile data into the redirect URL as query params.
                // This avoids cross-domain cookie issues entirely — no /me call needed.
                String redirectUrl = frontendUrl + "/oauth-callback"
                        + "?profileId=" + profile.getId()
                        + "&name="  + URLEncoder.encode(name  != null ? name  : "", StandardCharsets.UTF_8)
                        + "&email=" + URLEncoder.encode(email != null ? email : "", StandardCharsets.UTF_8);

                response.sendRedirect(redirectUrl);
            }
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/error",
                    "/login",
                    "/oauth2/**",
                    "/v3/api-docs/**",
                    "/swagger-ui/**"
                ).permitAll()
                // /me is now optional — kept for session-based fallback
                .requestMatchers("/me").permitAll()
                .requestMatchers("/users/**", "/createUser").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .oauth2Login(oauth -> oauth
                .successHandler(oauthSuccessHandler())
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl(frontendUrl)
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            );

        return http.build();
    }
}
