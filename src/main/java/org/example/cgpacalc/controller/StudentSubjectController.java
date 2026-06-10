package org.example.cgpacalc.controller;

import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.SemesterSubjectSummaryDTO;
import org.example.cgpacalc.DTO.StudentSubjectRequestDTO;
import org.example.cgpacalc.DTO.StudentSubjectResponseDTO;
import org.example.cgpacalc.service.StudentSubjectService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users/{userId}/semesters/{semesterNumber}/subjects")
public class StudentSubjectController {

    private final StudentSubjectService studentSubjectService;

    @GetMapping
    public List<StudentSubjectResponseDTO> listSubjects(@PathVariable Long userId, @PathVariable int semesterNumber) {
        return studentSubjectService.listSubjects(userId, semesterNumber);
    }

    @GetMapping("/summary")
    public SemesterSubjectSummaryDTO summary(@PathVariable Long userId, @PathVariable int semesterNumber) {
        return studentSubjectService.getSummary(userId, semesterNumber);
    }

    @PostMapping
    public SemesterSubjectSummaryDTO addSubject(
            @PathVariable Long userId,
            @PathVariable int semesterNumber,
            @RequestBody StudentSubjectRequestDTO dto) {
        return studentSubjectService.addSubject(userId, semesterNumber, dto);
    }

    @PutMapping("/{studentSubjectId}")
    public SemesterSubjectSummaryDTO updateSubject(
            @PathVariable Long userId,
            @PathVariable int semesterNumber,
            @PathVariable Long studentSubjectId,
            @RequestBody StudentSubjectRequestDTO dto) {
        return studentSubjectService.updateSubject(userId, semesterNumber, studentSubjectId, dto);
    }

    @DeleteMapping("/{studentSubjectId}")
    public SemesterSubjectSummaryDTO deleteSubject(
            @PathVariable Long userId,
            @PathVariable int semesterNumber,
            @PathVariable Long studentSubjectId) {
        return studentSubjectService.deleteSubject(userId, semesterNumber, studentSubjectId);
    }
}
