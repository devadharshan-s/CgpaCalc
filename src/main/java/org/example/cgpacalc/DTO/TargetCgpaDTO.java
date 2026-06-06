package org.example.cgpacalc.DTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class TargetCgpaDTO {

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private Double targetCgpa;

    @Positive
    private Integer remainingCredits;

}
