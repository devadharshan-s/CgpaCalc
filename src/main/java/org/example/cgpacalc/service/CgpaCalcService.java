package org.example.cgpacalc.service;

import lombok.RequiredArgsConstructor;
import org.example.cgpacalc.DTO.TargetCgpaDTO;
import org.example.cgpacalc.DTO.TargetCgpaResponse;
import org.example.cgpacalc.DTO.SemesterDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CgpaCalcService {

    private final SemesterService semesterService;

    public int calculateTotalCredits(List<SemesterDTO> semesterList){
        return semesterList.stream().map(SemesterDTO::getCredits).reduce(0, Integer::sum);
    }

    public double calculateWeightedSgpa(List<SemesterDTO> semesterList){
        return semesterList.stream().mapToDouble(s -> s.getSgpa() * s.getCredits()).sum();
    }

    public double calculateCgpa(Long userId){

        // Sem-wise cgpa data for the given user.
        List<SemesterDTO> semesters = semesterService.findAllSemesterByUserId(userId);

        if(semesters.isEmpty()){
            throw new RuntimeException("No semesters found for the given userId");
        }

            //get total credits & sgpa for all sems
            int totalCredits = calculateTotalCredits(semesters);//semesters.stream().mapToInt(Semester::getCredits).sum();
        double weightedSgpa = calculateWeightedSgpa(semesters);//semesters.stream().mapToDouble(s -> s.getSgpa() * s.getCredits()).sum();

        return weightedSgpa / totalCredits;
        }

        public TargetCgpaResponse calculateTargetCgpa(Long userId, TargetCgpaDTO targetCgpaDTO){

            if(userId == null || userId <= 0){
                throw new IllegalArgumentException("userId can't be null or less than zero");
            }

            if(targetCgpaDTO == null){
                throw new IllegalArgumentException("targetCgpaDTO can't be null");
            }

            if(targetCgpaDTO.getRemainingCredits() <= 0){
                throw new IllegalArgumentException("Remaining Credits can't be less than zero!");
            }

            TargetCgpaResponse targetCgpaResponse = new TargetCgpaResponse();

            List<SemesterDTO> semesters = semesterService.findAllSemesterByUserId(userId);

            int currentCredits = calculateTotalCredits(semesters);
            double currentCgpa = calculateCgpa(userId);

            int remainingCredits = targetCgpaDTO.getRemainingCredits();
            double targetCgpa = targetCgpaDTO.getTargetCgpa();

            double currentPoints = (double) currentCredits * currentCgpa;
            double targetPoints = targetCgpa * (double) (remainingCredits + currentCredits);

            double requiredSgpa = (targetPoints - currentPoints) / remainingCredits;

            targetCgpaResponse.setRequiredSgpa(requiredSgpa);
            targetCgpaResponse.setPossible(requiredSgpa <= 10);

            return targetCgpaResponse;
        }


    }
