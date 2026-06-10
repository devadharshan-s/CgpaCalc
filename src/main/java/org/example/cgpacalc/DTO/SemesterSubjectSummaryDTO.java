package org.example.cgpacalc.DTO;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SemesterSubjectSummaryDTO {
    private Long userId;
    private Integer semester;
    private Long semesterId;
    private Double sgpa;
    private Integer credits;
    private List<StudentSubjectResponseDTO> subjects;
}
