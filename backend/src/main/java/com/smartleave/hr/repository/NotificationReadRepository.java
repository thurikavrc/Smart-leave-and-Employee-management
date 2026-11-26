package com.smartleave.hr.repository;

import com.smartleave.hr.model.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {

    boolean existsByNotificationIdAndUserId(Long notificationId, Long userId);

    @Query("SELECT nr.notification.id FROM NotificationRead nr WHERE nr.user.id = :userId")
    Set<Long> findReadNotificationIdsByUserId(@Param("userId") Long userId);

    List<NotificationRead> findByUserId(Long userId);
}
