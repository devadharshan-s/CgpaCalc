package org.example.cgpacalc.service;

import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.model.Users;
import org.example.cgpacalc.repo.UsersRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CheckUserIfExists {

    private final UsersRepository usersRepository;

    public Users getUserOrThrow(Long userId){
        return usersRepository.findById(userId)
                .orElseThrow(() -> (new RuntimeException("User not found for the given UserId")));
    }
}
