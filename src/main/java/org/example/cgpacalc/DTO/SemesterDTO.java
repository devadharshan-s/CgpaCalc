package org.example.cgpacalc.DTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SemesterDTO {

    @Min(value = 1, message = "Semester must be greater than 0")
    private Integer semester;

    @DecimalMin(value = "0.0", message = "SGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "SGPA cannot exceed 10")
    private Double sgpa;

    @Positive(message = "Credits must be greater than 0")
    private Integer credits;

}
