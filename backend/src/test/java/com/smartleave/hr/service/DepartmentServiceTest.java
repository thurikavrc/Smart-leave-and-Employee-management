package com.smartleave.hr.service;

import com.smartleave.hr.dto.DepartmentRequest;
import com.smartleave.hr.dto.DepartmentResponse;
import com.smartleave.hr.dto.PagedResponse;
import com.smartleave.hr.exception.BadRequestException;
import com.smartleave.hr.exception.ConflictException;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock private DepartmentRepository departmentRepository;
    @Mock private EmployeeRepository employeeRepository;

    @InjectMocks
    private DepartmentService departmentService;

    private Department engineering;
    private Employee head;

    @BeforeEach
    void setUp() {
        head = new Employee();
        head.setId(2L);
        head.setFullName("Marcus Vance");

        engineering = new Department();
        engineering.setId(1L);
        engineering.setName("Engineering");
        engineering.setDescription("Software & Systems");
        engineering.setHeadEmployee(head);
        engineering.setCreatedAt(LocalDate.of(2025, 1, 1));
    }

    @Test
    void create_uniqueDepartment_savesAndReturnsHeadName() {
        DepartmentRequest req = new DepartmentRequest();
        req.setName("Finance");
        req.setDescription("Accounting & Payroll");
        req.setHeadEmployeeId(2L);

        when(departmentRepository.existsByNameIgnoreCase("Finance")).thenReturn(false);
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(head));
        when(departmentRepository.save(any(Department.class))).thenAnswer(inv -> {
            Department d = inv.getArgument(0);
            d.setId(5L);
            return d;
        });
        when(employeeRepository.countByDepartmentId(5L)).thenReturn(0L);

        DepartmentResponse response = departmentService.create(req);

        assertEquals("Finance", response.getName());
        assertEquals("Marcus Vance", response.getHeadName());
        assertEquals(2L, response.getHeadEmployeeId());
    }

    @Test
    void create_duplicateName_throwsConflict() {
        DepartmentRequest req = new DepartmentRequest();
        req.setName("Engineering");
        req.setDescription("Duplicate");
        when(departmentRepository.existsByNameIgnoreCase("Engineering")).thenReturn(true);

        assertThrows(ConflictException.class, () -> departmentService.create(req));
    }

    @Test
    void delete_withAssignedEmployees_throwsBadRequest() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(engineering));
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(4L);

        assertThrows(BadRequestException.class, () -> departmentService.delete(1L));
        verify(departmentRepository, never()).delete(any());
    }

    @Test
    void delete_emptyDepartment_deletesSuccessfully() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(engineering));
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(0L);

        departmentService.delete(1L);

        verify(departmentRepository).delete(engineering);
    }

    @Test
    void searchPaged_returnsPagedDepartmentResponses() {
        when(departmentRepository.searchDepartments(eq("Eng"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(engineering), PageRequest.of(0, 9), 1));
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(12L);

        PagedResponse<DepartmentResponse> page = departmentService.searchPaged(1, 9, "Eng");

        assertEquals(1, page.getTotalElements());
        assertEquals(12L, page.getContent().get(0).getEmployeeCount());
    }
}
