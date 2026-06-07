package org.example.cgpacalc.controller;

import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.ProfileDTO;
import org.example.cgpacalc.DTO.TargetCgpaDTO;
import org.example.cgpacalc.DTO.TargetCgpaResponse;
import org.example.cgpacalc.DTO.UserDTO;
import org.example.cgpacalc.service.CgpaCalcService;
import org.example.cgpacalc.service.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UsersController {

    private final UserService userService;
    private final CgpaCalcService cgpaCalcService;

    /**
     * Returns the authenticated Google user's profile info.
     * Frontend uses this to know who is logged in after OAuth redirect.
     */
    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal OAuth2User user) {
        if (user == null) {
            return Map.of("authenticated", false);
        }
        String email = user.getAttribute("email");
        String name  = user.getAttribute("name");

        // Auto-create or fetch profile for this Google user
        ProfileDTO profile = userService.createUser(name, email);

        return Map.of(
                "authenticated", true,
                "name",  name  != null ? name  : "",
                "email", email != null ? email : "",
                "profileId", profile.getId() != null ? profile.getId() : 0
        );
    }

    @GetMapping("/users/{id}/cgpa")
    public ProfileDTO getUserCgpa(@PathVariable Long id) {
        return userService.getProfile(id);
    }

    @GetMapping("/users/{id}/targetCgpa")
    public TargetCgpaResponse calculateTargetCgpa(@PathVariable Long id, TargetCgpaDTO targetCgpaDTO){
        return cgpaCalcService.calculateTargetCgpa(id, targetCgpaDTO);
    }

    @PostMapping("/createUser")
    public UserDTO createUser(@RequestBody UserDTO userDTO) {
        return userService.saveUser(userDTO);
    }
}
