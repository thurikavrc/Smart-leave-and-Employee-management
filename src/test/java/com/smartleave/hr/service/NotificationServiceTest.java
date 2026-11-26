package com.smartleave.hr.service;

import com.smartleave.hr.dto.NotificationResponse;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.Notification;
import com.smartleave.hr.model.NotificationRead;
import com.smartleave.hr.model.User;
import com.smartleave.hr.model.enums.NotificationCategory;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.NotificationReadRepository;
import com.smartleave.hr.repository.NotificationRepository;
import com.smartleave.hr.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationReadRepository notificationReadRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Employee managerA;
    private Employee managerB;
    private User userA;
    private Notification forManagerA;
    private Notification broadcastAll;

    @BeforeEach
    void setUp() {
        userA = new User();
        userA.setId(20L);
        userA.setEmail("managera@company.com");
        userA.setRole(UserRole.MANAGER);

        managerA = new Employee();
        managerA.setId(2L);
        managerA.setUser(userA);
        managerA.setEmail("managera@company.com");
        managerA.setRole(UserRole.MANAGER);

        managerB = new Employee();
        managerB.setId(7L);
        managerB.setEmail("managerb@company.com");
        managerB.setRole(UserRole.MANAGER);

        forManagerA = new Notification();
        forManagerA.setId(1L);
        forManagerA.setTitle("Leave Applied");
        forManagerA.setMessage("Direct report applied");
        forManagerA.setCategory(NotificationCategory.LEAVE_APPLIED);
        forManagerA.setTargetRole("MANAGER");
        forManagerA.setRecipientEmployeeId(2L);
        forManagerA.setIsRead(false);
        forManagerA.setCreatedAt(Instant.now());

        broadcastAll = new Notification();
        broadcastAll.setId(2L);
        broadcastAll.setTitle("Holiday Notice");
        broadcastAll.setMessage("Office closed");
        broadcastAll.setCategory(NotificationCategory.SYSTEM);
        broadcastAll.setTargetRole("ALL");
        broadcastAll.setRecipientEmployeeId(null);
        broadcastAll.setIsRead(false);
        broadcastAll.setCreatedAt(Instant.now());
    }

    @Test
    void isVisibleTo_preventsCrossManagerLeakage() {
        assertTrue(notificationService.isVisibleTo(forManagerA, managerA));
        assertFalse(notificationService.isVisibleTo(forManagerA, managerB));
        assertTrue(notificationService.isVisibleTo(broadcastAll, managerB));
    }

    @Test
    void markAsRead_broadcastNotification_tracksPerUserWithoutMutatingGlobalFlag() {
        when(notificationRepository.findById(2L)).thenReturn(Optional.of(broadcastAll));
        when(notificationReadRepository.existsByNotificationIdAndUserId(2L, 20L)).thenReturn(false);

        notificationService.markAsRead(2L, managerA);

        verify(notificationReadRepository).save(any(NotificationRead.class));
        assertFalse(broadcastAll.getIsRead());
    }

    @Test
    void getVisibleNotifications_resolvesPerUserReadStateForBroadcast() {
        when(notificationRepository.findVisibleNotifications("MANAGER", 2L))
                .thenReturn(List.of(forManagerA, broadcastAll));
        when(notificationReadRepository.findReadNotificationIdsByUserId(20L))
                .thenReturn(Set.of(2L));

        List<NotificationResponse> visible = notificationService.getVisibleNotifications(managerA);

        assertEquals(2, visible.size());
        assertFalse(visible.get(0).isRead());
        assertTrue(visible.get(1).isRead());
    }

    @Test
    void markAsRead_otherManagerNotification_throwsAccessDenied() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(forManagerA));

        assertThrows(AccessDeniedException.class, () -> notificationService.markAsRead(1L, managerB));
        verify(notificationReadRepository, never()).save(any());
    }
}
