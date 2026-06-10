package org.example.cgpacalc.repo;

import org.example.cgpacalc.model.StudentSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentSubjectRepository extends JpaRepository<StudentSubject,Long> {
    @Query("""
            select ss
            from StudentSubject ss
            join fetch ss.user
            join fetch ss.semester
            join fetch ss.subject
            where ss.user.id = :userId and ss.semester.id = :semesterId
            order by ss.id asc
            """)
    List<StudentSubject> findByUserIdAndSemesterIdOrderByIdAsc(@Param("userId") Long userId, @Param("semesterId") Long semesterId);

    @Query("""
            select ss
            from StudentSubject ss
            join fetch ss.user
            join fetch ss.semester
            join fetch ss.subject
            where ss.id = :id and ss.user.id = :userId and ss.semester.id = :semesterId
            """)
    Optional<StudentSubject> findByIdAndUserIdAndSemesterId(
            @Param("id") Long id,
            @Param("userId") Long userId,
            @Param("semesterId") Long semesterId);

    @Query("select case when count(ss) > 0 then true else false end from StudentSubject ss where ss.subject.subjectId = :subjectId")
    boolean existsBySubjectId(@Param("subjectId") int subjectId);
}
