package org.example.cgpacalc.repo;

import org.example.cgpacalc.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Integer> {
    Optional<Subject> findByNameIgnoreCase(String name);

    List<Subject> findAllByOrderByNameAsc();
}
