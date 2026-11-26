package com.smartleave.hr.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "notification_reads",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_notif_read_user", columnNames = {"notification_id", "user_id"})
    }
)
public class NotificationRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "notification_id", nullable = false)
    private Notification notification;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "read_at", nullable = false)
    private Instant readAt = Instant.now();

    public NotificationRead() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Notification getNotification() { return notification; }
    public void setNotification(Notification notification) { this.notification = notification; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
}
