package com.smartleave.hr.service;

import com.smartleave.hr.dto.NotificationResponse;
import com.smartleave.hr.exception.ResourceNotFoundException;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.Notification;
import com.smartleave.hr.model.NotificationRead;
import com.smartleave.hr.model.User;
import com.smartleave.hr.model.enums.NotificationCategory;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.NotificationReadRepository;
import com.smartleave.hr.repository.NotificationRepository;
import com.smartleave.hr.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationReadRepository notificationReadRepository,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.notificationReadRepository = notificationReadRepository;
        this.userRepository = userRepository;
    }

    public List<NotificationResponse> getVisibleNotifications(Employee current) {
        List<Notification> visible = notificationRepository
                .findVisibleNotifications(current.getRole().name(), current.getId());
        Set<Long> readIds = resolveReadNotificationIds(current);

        return visible.stream()
                .map(n -> toResponse(n, isReadForUser(n, current, readIds)))
                .toList();
    }

    @Transactional
    public void markAsRead(Long id, Employee current) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!isVisibleTo(notification, current)) {
            throw new AccessDeniedException("You do not have permission to update this notification.");
        }

        User user = resolveUser(current);
        if (user != null) {
            if (!notificationReadRepository.existsByNotificationIdAndUserId(notification.getId(), user.getId())) {
                NotificationRead read = new NotificationRead();
                read.setNotification(notification);
                read.setUser(user);
                read.setReadAt(Instant.now());
                notificationReadRepository.save(read);
            }
        }

        // Only mutate notification.isRead when it is a single-recipient notification
        if (notification.getRecipientEmployeeId() != null
                && notification.getRecipientEmployeeId().equals(current.getId())
                && !Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(Employee current) {
        List<Notification> visible = notificationRepository
                .findVisibleNotifications(current.getRole().name(), current.getId());
        User user = resolveUser(current);
        Set<Long> alreadyRead = user != null
                ? notificationReadRepository.findReadNotificationIdsByUserId(user.getId())
                : Collections.emptySet();

        for (Notification n : visible) {
            if (user != null && !alreadyRead.contains(n.getId())) {
                NotificationRead read = new NotificationRead();
                read.setNotification(n);
                read.setUser(user);
                read.setReadAt(Instant.now());
                notificationReadRepository.save(read);
            }
            if (n.getRecipientEmployeeId() != null
                    && n.getRecipientEmployeeId().equals(current.getId())
                    && !Boolean.TRUE.equals(n.getIsRead())) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        }
    }

    @Transactional
    public void createNotification(
            String title,
            String message,
            NotificationCategory category,
            String targetRole,
            Long recipientEmployeeId,
            String actionUrl) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCategory(category);
        notification.setTargetRole(targetRole);
        notification.setRecipientEmployeeId(recipientEmployeeId);
        notification.setIsRead(false);
        notification.setCreatedAt(Instant.now());
        notification.setActionUrl(actionUrl);
        notificationRepository.save(notification);
    }

    public boolean isVisibleTo(Notification n, Employee current) {
        String target = n.getTargetRole();
        if ("ALL".equals(target)) {
            return true;
        }
        if (current.getRole() == UserRole.ADMIN) {
            return "ADMIN".equals(target)
                    || ("MANAGER".equals(target)
                        && (n.getRecipientEmployeeId() == null || n.getRecipientEmployeeId().equals(current.getId())))
                    || Objects.equals(n.getRecipientEmployeeId(), current.getId());
        }
        if (current.getRole() == UserRole.MANAGER) {
            return ("MANAGER".equals(target)
                        && (n.getRecipientEmployeeId() == null || n.getRecipientEmployeeId().equals(current.getId())))
                    || Objects.equals(n.getRecipientEmployeeId(), current.getId());
        }
        return "EMPLOYEE".equals(target)
                && (n.getRecipientEmployeeId() == null || n.getRecipientEmployeeId().equals(current.getId()));
    }

    private Set<Long> resolveReadNotificationIds(Employee current) {
        User user = resolveUser(current);
        if (user == null) {
            return Collections.emptySet();
        }
        return notificationReadRepository.findReadNotificationIdsByUserId(user.getId());
    }

    private User resolveUser(Employee current) {
        if (current.getUser() != null) {
            return current.getUser();
        }
        if (current.getEmail() != null) {
            return userRepository.findByEmailIgnoreCase(current.getEmail()).orElse(null);
        }
        return null;
    }

    private boolean isReadForUser(Notification n, Employee current, Set<Long> readIds) {
        if (readIds.contains(n.getId())) {
            return true;
        }
        return n.getRecipientEmployeeId() != null
                && n.getRecipientEmployeeId().equals(current.getId())
                && Boolean.TRUE.equals(n.getIsRead());
    }

    private NotificationResponse toResponse(Notification n, boolean isReadForUser) {
        NotificationResponse res = new NotificationResponse();
        res.setId(n.getId());
        res.setTitle(n.getTitle());
        res.setMessage(n.getMessage());
        res.setCategory(n.getCategory());
        res.setTargetRole(n.getTargetRole());
        res.setRecipientEmployeeId(n.getRecipientEmployeeId());
        res.setIsRead(isReadForUser);
        res.setCreatedAt(n.getCreatedAt());
        res.setActionUrl(n.getActionUrl());
        return res;
    }
}
