package org.example.cgpacalc.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.SubjectDTO;
import org.example.cgpacalc.enums.Grade;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SgpaCalcService {

    @Transactional
    public double calculateSgpa(List<SubjectDTO> subjects) {
        if (subjects == null || subjects.isEmpty()) {
            return 0.0;
        }

        double weightedSgpa = subjects.stream()
                .mapToDouble(s -> s.getCredits() * Grade.valueOf(s.getGrade()).getPoints())
                .sum();
        int totalCredits = subjects.stream()
                .map(SubjectDTO::getCredits).reduce(0, Integer::sum);
//        for(SubjectDTO subject:subjects){
//            String subjectName = subject.getSubjectName();
//            String grade = subject.getGrade();
//
//            int gradePoint = Grade.valueOf(grade).getPoints();
//            int credits = subject.getCredits();
//
//            Weightedsgpa += credits * gradePoint;
//            totalCredits += subject.getCredits();
//        }

        return totalCredits == 0 ? 0.0 : weightedSgpa / totalCredits;
    }
}
