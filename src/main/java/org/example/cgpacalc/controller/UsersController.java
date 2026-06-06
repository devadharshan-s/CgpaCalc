package org.example.cgpacalc.controller;

import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.ProfileDTO;
import org.example.cgpacalc.DTO.TargetCgpaDTO;
import org.example.cgpacalc.DTO.TargetCgpaResponse;
import org.example.cgpacalc.DTO.UserDTO;
import org.example.cgpacalc.service.CgpaCalcService;
import org.example.cgpacalc.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UsersController {

    private final UserService userService;
    private final CgpaCalcService cgpaCalcService;

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
