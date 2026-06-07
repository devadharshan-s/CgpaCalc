//package org.example.cgpacalc.controller;
//
//import org.springframework.security.core.annotation.AuthenticationPrincipal;
//import org.springframework.security.oauth2.core.user.OAuth2User;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//import java.util.Map;
//
//@RestController
//public class AuthController {
//
//    @GetMapping("/me")
//    public Map<String, Object> me(
//            @AuthenticationPrincipal OAuth2User user) {
//        return user.getAttributes();
//    }
//}
