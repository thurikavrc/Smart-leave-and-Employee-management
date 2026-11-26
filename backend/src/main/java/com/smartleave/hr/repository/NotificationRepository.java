package com.smartleave.hr.repository;

import com.smartleave.hr.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("""
        SELECT n FROM Notification n
        WHERE n.targetRole = 'ALL'
           OR (:role = 'ADMIN' AND (
                 n.targetRole = 'ADMIN'
                 OR (n.targetRole = 'MANAGER' AND (n.recipientEmployeeId IS NULL OR n.recipientEmployeeId = :employeeId))
                 OR n.recipientEmployeeId = :employeeId
              ))
           OR (:role = 'MANAGER' AND (
                 (n.targetRole = 'MANAGER' AND (n.recipientEmployeeId IS NULL OR n.recipientEmployeeId = :employeeId))
                 OR n.recipientEmployeeId = :employeeId
              ))
           OR (:role = 'EMPLOYEE' AND n.targetRole = 'EMPLOYEE' AND (n.recipientEmployeeId IS NULL OR n.recipientEmployeeId = :employeeId))
        ORDER BY n.createdAt DESC
    """)
    List<Notification> findVisibleNotifications(
        @Param("role") String role,
        @Param("employeeId") Long employeeId
    );
}
