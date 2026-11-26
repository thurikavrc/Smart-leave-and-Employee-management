package com.smartleave.hr.service;

import com.smartleave.hr.dto.LeavePolicyRequest;
import com.smartleave.hr.exception.ConflictException;
import com.smartleave.hr.exception.ResourceNotFoundException;
import com.smartleave.hr.model.LeavePolicy;
import com.smartleave.hr.repository.LeavePolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class LeavePolicyService {

    private final LeavePolicyRepository leavePolicyRepository;

    public LeavePolicyService(LeavePolicyRepository leavePolicyRepository) {
        this.leavePolicyRepository = leavePolicyRepository;
    }

    public List<LeavePolicy> getAll() {
        return leavePolicyRepository.findAll();
    }

    @Transactional
    public LeavePolicy create(LeavePolicyRequest request) {
        if (leavePolicyRepository.findByLeaveType(request.getLeaveType()).isPresent()) {
            throw new ConflictException("A policy already exists for leave type: " + request.getLeaveType());
        }

        LeavePolicy policy = new LeavePolicy();
        policy.setLeaveType(request.getLeaveType());
        policy.setDisplayName(request.getDisplayName().trim());
        policy.setAnnualAllowance(request.getAnnualAllowance());
        policy.setDescription(request.getDescription().trim());
        policy.setIsActive(request.getIsActive());
        policy.setCarryForwardAllowed(request.getCarryForwardAllowed());
        policy.setUpdatedAt(LocalDate.now());
        return leavePolicyRepository.save(policy);
    }

    @Transactional
    public LeavePolicy update(Long id, LeavePolicyRequest request) {
        LeavePolicy policy = leavePolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave policy not found with id: " + id));

        leavePolicyRepository.findByLeaveType(request.getLeaveType())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("A policy already exists for leave type: " + request.getLeaveType());
                });

        policy.setLeaveType(request.getLeaveType());
        policy.setDisplayName(request.getDisplayName().trim());
        policy.setAnnualAllowance(request.getAnnualAllowance());
        policy.setDescription(request.getDescription().trim());
        policy.setIsActive(request.getIsActive());
        policy.setCarryForwardAllowed(request.getCarryForwardAllowed());
        policy.setUpdatedAt(LocalDate.now());
        return leavePolicyRepository.save(policy);
    }

    @Transactional
    public void delete(Long id) {
        LeavePolicy policy = leavePolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave policy not found with id: " + id));
        leavePolicyRepository.delete(policy);
    }
}
