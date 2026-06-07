package org.example.cgpacalc.DTO;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProfileDTO {

    private Long id;

    private String name;

    private String email;

    private Double cgpa;

    private List<SemesterDTO> semesters;
}