package org.example.cgpacalc.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentSubjectResponseDTO {
    private Long id;
    private Integer semester;
    private SubjectResponseDTO subject;
    private String grade;
    private Integer gradePoints;
}
