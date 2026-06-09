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
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final CgpaCalcService cgpaCalcService;
    private final UsersRepository usersRepository;
    private final SemesterService semesterService;
    private final SemesterRepository semesterRepository;

    public ProfileDTO getProfile(Long userId){

        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> (new RuntimeException("User not found for the given UserId")));

        List<SemesterDTO> semesters = semesterService.findAllSemesterByUserId(userId);

        double cgpa = 0.00;

        if(!semesters.isEmpty()){
            cgpa = cgpaCalcService.calculateCgpa(userId);
        }

        ProfileDTO profileDTO = new ProfileDTO();

        profileDTO.setId(user.getId());
        profileDTO.setName(user.getName());
        profileDTO.setEmail(user.getEmail());
        profileDTO.setCgpa(cgpa);
        profileDTO.setSemesters(semesters);

        return profileDTO;
    }

    public ProfileDTO createUser(String username, String email){
        Optional<Users> user = usersRepository.findByEmail(email);

        if(user.isPresent()){
            return getProfile(user.get().getId());
        }

        UserDTO userDTO = new UserDTO();
        userDTO.setUserName(username);
        userDTO.setEmail(email);

        UserDTO savedUser = saveUser(userDTO);

        ProfileDTO profileDTO = new ProfileDTO();

        profileDTO.setId(savedUser.getId());
        profileDTO.setName(username);
        profileDTO.setEmail(email);
        profileDTO.setCgpa(0.0);
        profileDTO.setSemesters(List.of());

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

        Users savedUser = usersRepository.save(user);

        userDTO.setId(savedUser.getId());
        return userDTO;
    }


}
