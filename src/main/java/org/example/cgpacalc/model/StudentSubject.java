package org.example.cgpacalc.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.example.cgpacalc.enums.Grade;

@Entity
@Table(
        name = "student_subjects",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "semester_id", "subject_id"})
)
@Getter @Setter
public class StudentSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "user_id")
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name="semester_id")
    private Semester semester;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade;
}
