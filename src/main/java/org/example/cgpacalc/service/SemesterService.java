    package org.example.cgpacalc.service;

    import jakarta.transaction.Transactional;
    import lombok.RequiredArgsConstructor;
    import org.example.cgpacalc.DTO.SemesterDTO;
    import org.example.cgpacalc.model.Semester;
    import org.example.cgpacalc.model.Users;
    import org.example.cgpacalc.repo.SemesterRepository;
    import org.springframework.stereotype.Service;

    import java.util.List;

    @Service
    @RequiredArgsConstructor
    public class SemesterService {

        private final SemesterRepository semesterRepository;
        private final CheckUserIfExists checkUserIfExists;

        public boolean validateSemester(Long semesterId){
            return semesterId != null && semesterId > 0;
        }

        public List<SemesterDTO> findAllSemesterByUserId(Long userId){
            List<Semester> semesters = semesterRepository.findByUserId(userId);

            return semesters.stream()
                    .map(s -> {
                        SemesterDTO semesterDTO = new SemesterDTO();
                        semesterDTO.setSemester(s.getSemester());
                        semesterDTO.setSgpa(s.getSgpa());
                        semesterDTO.setCredits(s.getCredits());

                        return semesterDTO;
                    }).toList();
        }

        @Transactional
        public SemesterDTO saveSemester(Long userId, SemesterDTO semester){
            Semester newSemester = new Semester();

    //        Users user = usersRepository.findById(userId)
    //                .orElseThrow(() -> new RuntimeException("Current user not found! " + userId ));

            Users user = checkUserIfExists.getUserOrThrow(userId);

            newSemester.setSemester(semester.getSemester());
            newSemester.setCredits(semester.getCredits());
            newSemester.setSgpa(semester.getSgpa());
            newSemester.setUser(user);

            semesterRepository.save(newSemester);

            return semester;
        }

        @Transactional
        public SemesterDTO updateSemester(Long userId, SemesterDTO semester){

            checkUserIfExists.getUserOrThrow(userId);

            if(!validateSemester((long) semester.getSemester())){
                throw new IllegalArgumentException("Semester is not valid: ");
            }

            Semester semToBeUpdated = semesterRepository.findByUserIdAndSemester(userId, semester.getSemester())
                    .orElseThrow(() -> new RuntimeException("Semester not found: " +  semester.getSemester()));

            semToBeUpdated.setCredits(semester.getCredits());
            semToBeUpdated.setSgpa(semester.getSgpa());

            Semester updated = semesterRepository.save(semToBeUpdated);

            SemesterDTO semesterDTO = new SemesterDTO();
            semesterDTO.setSemester(updated.getSemester());
            semesterDTO.setSgpa(updated.getSgpa());
            semesterDTO.setCredits(updated.getCredits());

            return semesterDTO;
        }

        @Transactional
        public void deleteSemester(Long userId, Long semesterId){
            Users user = checkUserIfExists.getUserOrThrow(userId);

            if(!validateSemester(semesterId)){
                throw new IllegalArgumentException("Semester id must be greater than 0");
            }

            Semester semester = semesterRepository.findById(semesterId)
                    .orElseThrow(() -> new RuntimeException("Semester not found: " +  semesterId));

            if(!semester.getUser().getId().equals(user.getId())){
                throw new RuntimeException("Semester doesn't belong to this User!");
            }

            semesterRepository.delete(semester);
        }

    }
