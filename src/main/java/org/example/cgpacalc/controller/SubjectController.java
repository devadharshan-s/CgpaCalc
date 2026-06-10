package org.example.cgpacalc.controller;

import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.SubjectRequestDTO;
import org.example.cgpacalc.DTO.SubjectResponseDTO;
import org.example.cgpacalc.service.SubjectService;
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
@RequestMapping("/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public List<SubjectResponseDTO> listSubjects() {
        return subjectService.findAll();
    }

    @GetMapping("/{subjectId}")
    public SubjectResponseDTO getSubject(@PathVariable Integer subjectId) {
        return subjectService.findById(subjectId);
    }

    @PostMapping
    public SubjectResponseDTO createSubject(@RequestBody SubjectRequestDTO dto) {
        return subjectService.create(dto);
    }

    @PutMapping("/{subjectId}")
    public SubjectResponseDTO updateSubject(@PathVariable Integer subjectId, @RequestBody SubjectRequestDTO dto) {
        return subjectService.update(subjectId, dto);
    }

    @DeleteMapping("/{subjectId}")
    public String deleteSubject(@PathVariable Integer subjectId) {
        subjectService.delete(subjectId);
        return "Subject deleted successfully!";
    }
}
