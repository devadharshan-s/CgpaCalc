package org.example.cgpacalc.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.SemesterDTO;
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

    private static final int MAX_SEMESTERS = 8;

    public boolean validateSemester(Long semesterId) {
        return semesterId != null && semesterId > 0 && semesterId <= MAX_SEMESTERS;
    }

    public List<SemesterDTO> findAllSemesterByUserId(Long userId) {
        List<Semester> semesters = semesterRepository.findByUserId(userId);

        return semesters.stream()
                .map(s -> {
                    SemesterDTO semesterDTO = new SemesterDTO();
                    semesterDTO.setSemester(s.getSemester());
                    semesterDTO.setSgpa(s.getSgpa());
                    semesterDTO.setCredits(s.getCredits());
                    return semesterDTO;
                }).toList();
    }

    @Transactional
    public SemesterDTO saveSemester(Long userId, SemesterDTO semester) {
        Users user = checkUserIfExists.checkUserIfExists(userId);

        // Enforce 8-semester cap
        long existingCount = semesterRepository.findByUserId(userId).size();
        if (existingCount >= MAX_SEMESTERS) {
            throw new RuntimeException("Maximum of " + MAX_SEMESTERS + " semesters allowed");
        }

        // Prevent duplicate semester number
        if (semesterRepository.findByUserIdAndSemester(userId, semester.getSemester()).isPresent()) {
            throw new RuntimeException("Semester " + semester.getSemester() + " already exists");
        }

        Semester newSemester = new Semester();
        newSemester.setSemester(semester.getSemester());
        newSemester.setCredits(semester.getCredits());
        newSemester.setSgpa(semester.getSgpa());
        newSemester.setUser(user);

        semesterRepository.save(newSemester);

        return semester;
    }

    @Transactional
    public SemesterDTO updateSemester(Long userId, SemesterDTO semester) {
        checkUserIfExists.checkUserIfExists(userId);

        if (!validateSemester((long) semester.getSemester())) {
            throw new IllegalArgumentException("Semester must be between 1 and 8");
        }

        Semester semToBeUpdated = semesterRepository.findByUserIdAndSemester(userId, semester.getSemester())
                .orElseThrow(() -> new RuntimeException("Semester not found: " + semester.getSemester()));

        semToBeUpdated.setCredits(semester.getCredits());
        semToBeUpdated.setSgpa(semester.getSgpa());

        Semester updated = semesterRepository.save(semToBeUpdated);

        SemesterDTO semesterDTO = new SemesterDTO();
        semesterDTO.setSemester(updated.getSemester());
        semesterDTO.setSgpa(updated.getSgpa());
        semesterDTO.setCredits(updated.getCredits());

        return semesterDTO;
    }

    @Transactional
    public void deleteSemester(Long userId, Long semesterId) {
        Users user = checkUserIfExists.checkUserIfExists(userId);

        if (!validateSemester(semesterId)) {
            throw new IllegalArgumentException("Semester id must be between 1 and 8");
        }

        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Semester not found: " + semesterId));

        if (!semester.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Semester doesn't belong to this user!");
        }

        semesterRepository.delete(semester);
    }
}
