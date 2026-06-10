package org.example.cgpacalc.service;

import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.SubjectRequestDTO;
import org.example.cgpacalc.DTO.SubjectResponseDTO;
import org.example.cgpacalc.model.Subject;
import org.example.cgpacalc.repo.StudentSubjectRepository;
import org.example.cgpacalc.repo.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final StudentSubjectRepository studentSubjectRepository;

    public List<SubjectResponseDTO> findAll() {
        return subjectRepository.findAllByOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    public SubjectResponseDTO findById(Integer subjectId) {
        return toResponse(subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + subjectId)));
    }

    @Transactional
    public SubjectResponseDTO create(SubjectRequestDTO dto) {
        validate(dto);
        String name = dto.getName().trim();

        if (subjectRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new RuntimeException("Subject already exists: " + name);
        }

        Subject subject = new Subject();
        subject.setName(name);
        subject.setCredits(dto.getCredits());

        return toResponse(subjectRepository.save(subject));
    }

    @Transactional
    public SubjectResponseDTO update(Integer subjectId, SubjectRequestDTO dto) {
        validate(dto);
        String name = dto.getName().trim();

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + subjectId));

        subjectRepository.findByNameIgnoreCase(name)
                .filter(existing -> existing.getSubjectId() != subjectId)
                .ifPresent(existing -> {
                    throw new RuntimeException("Subject already exists: " + name);
                });

        subject.setName(name);
        subject.setCredits(dto.getCredits());

        return toResponse(subjectRepository.save(subject));
    }

    @Transactional
    public void delete(Integer subjectId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + subjectId));

        if (studentSubjectRepository.existsBySubjectId(subjectId)) {
            throw new RuntimeException("Subject is already assigned to a student and cannot be deleted");
        }

        subjectRepository.delete(subject);
    }

    private void validate(SubjectRequestDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Subject name is required");
        }
        if (dto.getCredits() <= 0) {
            throw new IllegalArgumentException("Credits must be greater than 0");
        }
    }

    private SubjectResponseDTO toResponse(Subject subject) {
        SubjectResponseDTO response = new SubjectResponseDTO();
        response.setSubjectId(subject.getSubjectId());
        response.setName(subject.getName());
        response.setCredits(subject.getCredits());
        return response;
    }
}
