package org.example.cgpacalc.DTO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SemesterRequestDTO {

    @Min(value = 1, message = "Semester must be greater than 0")
    @Max(value = 8, message = "Maximum 8 semesters allowed")
    private Integer semester;

    @Positive(message = "Credits must be greater than 0")
    private Integer credits;
}
