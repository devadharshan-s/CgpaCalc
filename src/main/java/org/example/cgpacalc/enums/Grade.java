package org.example.cgpacalc.enums;

import lombok.Getter;

@Getter
public enum Grade {

    O(10),
    A_PLUS(9),
    A(8),
    B_PLUS(7),
    B(6),
    C(5),
    U(0);

    private final int points;

    Grade(int points) {
        this.points = points;
    }
}