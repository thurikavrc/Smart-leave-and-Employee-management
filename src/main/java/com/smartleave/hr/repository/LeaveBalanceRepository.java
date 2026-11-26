package com.smartleave.hr.repository;

import com.smartleave.hr.model.LeaveBalance;
import com.smartleave.hr.model.enums.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    List<LeaveBalance> findByEmployeeIdAndLeaveYear(Long employeeId, Integer leaveYear);
    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeAndLeaveYear(Long employeeId, LeaveType leaveType, Integer leaveYear);
    void deleteByEmployeeId(Long employeeId);
}
