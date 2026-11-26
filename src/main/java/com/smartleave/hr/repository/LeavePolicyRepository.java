package com.smartleave.hr.repository;

import com.smartleave.hr.model.LeavePolicy;
import com.smartleave.hr.model.enums.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LeavePolicyRepository extends JpaRepository<LeavePolicy, Long> {
    Optional<LeavePolicy> findByLeaveType(LeaveType leaveType);
}
