package com.smartleave.hr.repository;

import com.smartleave.hr.model.LeaveDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeaveDocumentRepository extends JpaRepository<LeaveDocument, Long> {
    Optional<LeaveDocument> findByLeaveRequestId(Long leaveRequestId);
    boolean existsByLeaveRequestId(Long leaveRequestId);
}
