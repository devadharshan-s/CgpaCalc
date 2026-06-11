package org.example.cgpacalc.controller;

import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.SemesterDTO;
import org.example.cgpacalc.DTO.SemesterRequestDTO;
import org.example.cgpacalc.service.SemesterService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @PostMapping("/users/{userId}/semester")
    public SemesterDTO saveSemester(@PathVariable Long userId,
                                    @RequestBody SemesterRequestDTO semester) {
        return semesterService.saveSemester(userId, semester);
    }

    @PatchMapping("/users/{userId}/updateSemester")
    public SemesterDTO updateSemester(@PathVariable Long userId,
                                      @RequestBody SemesterRequestDTO semester) {
        return semesterService.updateSemester(userId, semester);
    }

    /**
     * Delete by semester NUMBER in path — no more body needed, no more ID confusion.
     * DELETE /users/{userId}/semesters/{semesterNumber}
     */
    @DeleteMapping("/users/{userId}/semesters/{semesterNumber}")
    public String deleteSemester(@PathVariable Long userId,
                                 @PathVariable int semesterNumber) {
        semesterService.deleteSemester(userId, semesterNumber);
        return "Semester " + semesterNumber + " deleted successfully";
    }
}
