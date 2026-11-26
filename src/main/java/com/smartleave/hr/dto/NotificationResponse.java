package com.smartleave.hr.dto;

import com.smartleave.hr.model.enums.NotificationCategory;
import java.time.Instant;

public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private NotificationCategory category;
    private String targetRole;
    private Long recipientEmployeeId;
    private Boolean isRead;
    private Instant createdAt;
    private String actionUrl;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NotificationCategory getCategory() { return category; }
    public void setCategory(NotificationCategory category) { this.category = category; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public Long getRecipientEmployeeId() { return recipientEmployeeId; }
    public void setRecipientEmployeeId(Long recipientEmployeeId) { this.recipientEmployeeId = recipientEmployeeId; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }
}
