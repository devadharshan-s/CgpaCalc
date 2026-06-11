package org.example.cgpacalc.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.SemesterDTO;
import org.example.cgpacalc.DTO.SemesterRequestDTO;
import org.example.cgpacalc.DTO.SemesterSubjectSummaryDTO;
import org.example.cgpacalc.model.Semester;
import org.example.cgpacalc.model.Users;
import org.example.cgpacalc.repo.SemesterRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SemesterService {

    private final SemesterRepository semesterRepository;
    private final CheckUserIfExists checkUserIfExists;
    private final StudentSubjectService studentSubjectService;

    private static final int MAX_SEMESTERS = 8;

    public List<SemesterDTO> findAllSemesterByUserId(Long userId) {
        return semesterRepository.findByUserId(userId).stream()
                .map(s -> toSemesterDTO(userId, s))
                .toList();
    }

    @Transactional
    public SemesterDTO saveSemester(Long userId, SemesterRequestDTO request) {
        Users user = checkUserIfExists.checkUserIfExists(userId);

        long count = semesterRepository.findByUserId(userId).size();
        if (count >= MAX_SEMESTERS) {
            throw new RuntimeException("Maximum of " + MAX_SEMESTERS + " semesters allowed");
        }

        if (semesterRepository.findByUserIdAndSemester(userId, request.getSemester()).isPresent()) {
            throw new RuntimeException("Semester " + request.getSemester() + " already exists");
        }

        Semester s = new Semester();
        s.setSemester(request.getSemester());
        s.setCredits(0);
        s.setUser(user);
        semesterRepository.save(s);

        return toSemesterDTO(userId, s);
    }

    @Transactional
    public SemesterDTO updateSemester(Long userId, SemesterRequestDTO request) {
        checkUserIfExists.checkUserIfExists(userId);

        Semester s = semesterRepository.findByUserIdAndSemester(userId, request.getSemester())
                .orElseThrow(() -> new RuntimeException("Semester not found: " + request.getSemester()));

        s.setCredits(request.getCredits());
        semesterRepository.save(s);
        return toSemesterDTO(userId, s);
    }

    /**
     * Delete by semester NUMBER (1-8), not DB row ID.
     * Deletes all student_subjects first, then the semester row,
     * so CGPA auto-recalculates next time /users/{id}/cgpa is called.
     */
    @Transactional
    public void deleteSemester(Long userId, int semesterNumber) {
        if (semesterNumber < 1 || semesterNumber > MAX_SEMESTERS) {
            throw new IllegalArgumentException("Semester must be between 1 and 8");
        }

        Users user = checkUserIfExists.checkUserIfExists(userId);

        Semester semester = semesterRepository.findByUserIdAndSemester(userId, semesterNumber)
                .orElseThrow(() -> new RuntimeException("Semester " + semesterNumber + " not found"));

        if (!semester.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Semester doesn't belong to this user");
        }

        // Delete all subjects for this semester first (FK constraint)
        studentSubjectService.deleteAllForSemester(semester.getId());
        semesterRepository.delete(semester);
    }

    private SemesterDTO toSemesterDTO(Long userId, Semester semester) {
        SemesterSubjectSummaryDTO summary = studentSubjectService.getSummary(userId, semester.getSemester());
        SemesterDTO dto = new SemesterDTO();
        dto.setSemester(semester.getSemester());
        dto.setSgpa(summary.getSgpa());
        dto.setCredits(summary.getCredits());
        return dto;
    }
}
