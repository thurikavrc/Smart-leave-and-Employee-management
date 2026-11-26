package com.smartleave.hr.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "head_employee_id")
    private Employee headEmployee;

    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt = LocalDate.now();

    public Department() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Employee getHeadEmployee() { return headEmployee; }
    public void setHeadEmployee(Employee headEmployee) { this.headEmployee = headEmployee; }

    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
