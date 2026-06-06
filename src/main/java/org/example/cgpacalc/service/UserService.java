package org.example.cgpacalc.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.ProfileDTO;
import org.example.cgpacalc.DTO.SemesterDTO;
import org.example.cgpacalc.DTO.UserDTO;
import org.example.cgpacalc.model.Users;
import org.example.cgpacalc.repo.SemesterRepository;
import org.example.cgpacalc.repo.UsersRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final CgpaCalcService cgpaCalcService;
    private final UsersRepository usersRepository;
    private final SemesterService semesterService;
    private final SemesterRepository semesterRepository;

    public ProfileDTO getProfile(Long userId){

        ProfileDTO profileDTO = new ProfileDTO();

        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> (new RuntimeException("User not found for the given UserId")));

        double cgpa = cgpaCalcService.calculateCgpa(userId);

        List<SemesterDTO> semesters = semesterService.findAllSemesterByUserId(userId);

//        List<SemesterDTO> semesterDTOS = semesters.stream()
//                .map(s -> {
//                    SemesterDTO semesterDTO = new SemesterDTO();
//                    semesterDTO.setSgpa(s.getSgpa());
//                    semesterDTO.setSemester(s.getSemester());
//                    semesterDTO.setCredits(s.getCredits());
//                    return semesterDTO;
//                })
//                .toList();

        profileDTO.setName(user.getName());
        profileDTO.setEmail(user.getEmail());
        profileDTO.setCgpa(cgpa);
        profileDTO.setSemesters(semesters);

        return profileDTO;

    }

    @Transactional
    public UserDTO saveUser(UserDTO userDTO){

        String email = userDTO.getEmail();

        if(!email.contains("@") || !email.contains(".com")){
            throw new RuntimeException("Invalid Email Address");
        }

        if(usersRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        Users user = new Users();

        user.setEmail(email);
        user.setName(userDTO.getUserName());

        usersRepository.save(user);

        return userDTO;
    }


}
