package org.example.cgpacalc.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.SemesterSubjectSummaryDTO;
import org.example.cgpacalc.DTO.StudentSubjectRequestDTO;
import org.example.cgpacalc.DTO.StudentSubjectResponseDTO;
import org.example.cgpacalc.DTO.SubjectResponseDTO;
import org.example.cgpacalc.enums.Grade;
import org.example.cgpacalc.model.Semester;
import org.example.cgpacalc.model.StudentSubject;
import org.example.cgpacalc.model.Subject;
import org.example.cgpacalc.model.Users;
import org.example.cgpacalc.repo.SemesterRepository;
import org.example.cgpacalc.repo.StudentSubjectRepository;
import org.example.cgpacalc.repo.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentSubjectService {

    private final CheckUserIfExists checkUserIfExists;
    private final SemesterRepository semesterRepository;
    private final StudentSubjectRepository studentSubjectRepository;
    private final SubjectRepository subjectRepository;

    public List<StudentSubjectResponseDTO> listSubjects(Long userId, int semesterNumber) {
        Semester semester = getSemesterOrThrow(userId, semesterNumber);
        return studentSubjectRepository.findByUserIdAndSemesterIdOrderByIdAsc(userId, semester.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public SemesterSubjectSummaryDTO getSummary(Long userId, int semesterNumber) {
        Semester semester = getSemesterOrThrow(userId, semesterNumber);
        return buildSummary(userId, semester);
    }

    @Transactional
    public SemesterSubjectSummaryDTO addSubject(Long userId, int semesterNumber, StudentSubjectRequestDTO dto) {
        Users user = checkUserIfExists.checkUserIfExists(userId);
        Semester semester = getSemesterOrCreate(userId, semesterNumber);
        Subject subject = getSubjectOrThrow(dto.getSubjectId());

        ensureUniqueAssignment(userId, semester.getId(), subject.getSubjectId(), null);

        StudentSubject studentSubject = new StudentSubject();
        studentSubject.setUser(user);
        studentSubject.setSemester(semester);
        studentSubject.setSubject(subject);
        studentSubject.setGrade(parseGrade(dto.getGrade()));

        studentSubjectRepository.save(studentSubject);
        return recalculateSemester(userId, semester);
    }

    @Transactional
    public SemesterSubjectSummaryDTO updateSubject(Long userId, int semesterNumber, Long studentSubjectId, StudentSubjectRequestDTO dto) {
        Semester semester = getSemesterOrThrow(userId, semesterNumber);
        StudentSubject studentSubject = studentSubjectRepository.findByIdAndUserIdAndSemesterId(studentSubjectId, userId, semester.getId())
                .orElseThrow(() -> new RuntimeException("Student subject not found: " + studentSubjectId));

        Subject subject = getSubjectOrThrow(dto.getSubjectId());
        ensureUniqueAssignment(userId, semester.getId(), subject.getSubjectId(), studentSubjectId);

        studentSubject.setSubject(subject);
        studentSubject.setGrade(parseGrade(dto.getGrade()));
        studentSubjectRepository.save(studentSubject);

        return recalculateSemester(userId, semester);
    }

    @Transactional
    public SemesterSubjectSummaryDTO deleteSubject(Long userId, int semesterNumber, Long studentSubjectId) {
        Semester semester = getSemesterOrThrow(userId, semesterNumber);
        StudentSubject studentSubject = studentSubjectRepository.findByIdAndUserIdAndSemesterId(studentSubjectId, userId, semester.getId())
                .orElseThrow(() -> new RuntimeException("Student subject not found: " + studentSubjectId));

        studentSubjectRepository.delete(studentSubject);
        return recalculateSemester(userId, semester);
    }

    public double calculateSemesterSgpa(Long userId, int semesterNumber) {
        Semester semester = getSemesterOrThrow(userId, semesterNumber);
        SemesterSubjectSummaryDTO summary = recalculateSemester(userId, semester);
        return summary.getSgpa();
    }

    private SemesterSubjectSummaryDTO recalculateSemester(Long userId, Semester semester) {
        List<StudentSubject> entries = studentSubjectRepository.findByUserIdAndSemesterIdOrderByIdAsc(
                userId, semester.getId());

        int totalCredits = entries.stream()
                .mapToInt(entry -> entry.getSubject().getCredits())
                .sum();

        double weightedPoints = entries.stream()
                .mapToDouble(entry -> entry.getSubject().getCredits() * entry.getGrade().getPoints())
                .sum();

        double sgpa = totalCredits == 0 ? 0.0 : weightedPoints / totalCredits;

        semester.setCredits(totalCredits);
        semesterRepository.save(semester);

        return buildSummary(userId, semester, entries, sgpa, totalCredits);
    }

    private SemesterSubjectSummaryDTO buildSummary(Long userId, Semester semester) {
        List<StudentSubject> entries = studentSubjectRepository.findByUserIdAndSemesterIdOrderByIdAsc(userId, semester.getId());
        int totalCredits = entries.stream().mapToInt(entry -> entry.getSubject().getCredits()).sum();
        double weightedPoints = entries.stream().mapToDouble(entry -> entry.getSubject().getCredits() * entry.getGrade().getPoints()).sum();
        double sgpa = totalCredits == 0 ? 0.0 : weightedPoints / totalCredits;
        return buildSummary(userId, semester, entries, sgpa, totalCredits);
    }

    private SemesterSubjectSummaryDTO buildSummary(Long userId, Semester semester, List<StudentSubject> entries, double sgpa, int totalCredits) {
        SemesterSubjectSummaryDTO summary = new SemesterSubjectSummaryDTO();
        summary.setUserId(userId);
        summary.setSemester(semester.getSemester());
        summary.setSemesterId(semester.getId());
        summary.setSgpa(sgpa);
        summary.setCredits(totalCredits);
        summary.setSubjects(entries.stream()
                .sorted(Comparator.comparing(entry -> entry.getSubject().getName(), String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponse)
                .toList());
        return summary;
    }

    private StudentSubjectResponseDTO toResponse(StudentSubject studentSubject) {
        StudentSubjectResponseDTO response = new StudentSubjectResponseDTO();
        response.setId(studentSubject.getId());
        response.setSemester(studentSubject.getSemester().getSemester());
        response.setGrade(studentSubject.getGrade().name());
        response.setGradePoints(studentSubject.getGrade().getPoints());
        response.setSubject(toSubjectResponse(studentSubject.getSubject()));
        return response;
    }

    private SubjectResponseDTO toSubjectResponse(Subject subject) {
        SubjectResponseDTO response = new SubjectResponseDTO();
        response.setSubjectId(subject.getSubjectId());
        response.setName(subject.getName());
        response.setCredits(subject.getCredits());
        return response;
    }

    private Semester getSemesterOrCreate(Long userId, int semesterNumber) {
        validateSemesterNumber(semesterNumber);
        Users user = checkUserIfExists.checkUserIfExists(userId);

        return semesterRepository.findByUserIdAndSemester(userId, semesterNumber)
                .orElseGet(() -> {
                    Semester semester = new Semester();
                    semester.setUser(user);
                    semester.setSemester(semesterNumber);
                    semester.setCredits(0);
                    return semesterRepository.save(semester);
                });
    }

    private Semester getSemesterOrThrow(Long userId, int semesterNumber) {
        validateSemesterNumber(semesterNumber);
        checkUserIfExists.checkUserIfExists(userId);
        return semesterRepository.findByUserIdAndSemester(userId, semesterNumber)
                .orElseThrow(() -> new RuntimeException("Semester not found: " + semesterNumber));
    }

    private Subject getSubjectOrThrow(Integer subjectId) {
        if (subjectId == null) {
            throw new IllegalArgumentException("Subject id is required");
        }
        return subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + subjectId));
    }

    private void ensureUniqueAssignment(Long userId, Long semesterId, Integer subjectId, Long ignoreStudentSubjectId) {
        List<StudentSubject> existing = studentSubjectRepository.findByUserIdAndSemesterIdOrderByIdAsc(userId, semesterId);
        boolean duplicate = existing.stream().anyMatch(entry ->
                entry.getSubject().getSubjectId() == subjectId
                        && (ignoreStudentSubjectId == null || !entry.getId().equals(ignoreStudentSubjectId)));
        if (duplicate) {
            throw new RuntimeException("Subject already added to this semester");
        }
    }

    private Grade parseGrade(String grade) {
        if (grade == null || grade.isBlank()) {
            throw new IllegalArgumentException("Grade is required");
        }
        return Grade.valueOf(grade.trim().toUpperCase());
    }

    private void validateSemesterNumber(int semesterNumber) {
        if (semesterNumber < 1 || semesterNumber > 8) {
            throw new IllegalArgumentException("Semester must be between 1 and 8");
        }
    }
}
