package com.smartleave.hr.service;

import com.smartleave.hr.dto.LeaveApplyRequest;
import com.smartleave.hr.dto.LeaveBalanceResponse;
import com.smartleave.hr.dto.LeaveResponse;
import com.smartleave.hr.dto.PagedResponse;
import com.smartleave.hr.exception.BadRequestException;
import com.smartleave.hr.exception.ConflictException;
import com.smartleave.hr.exception.ResourceNotFoundException;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.LeavePolicy;
import com.smartleave.hr.model.LeaveRequest;
import com.smartleave.hr.model.enums.LeaveStatus;
import com.smartleave.hr.model.enums.LeaveType;
import com.smartleave.hr.model.enums.NotificationCategory;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.EmployeeRepository;
import com.smartleave.hr.repository.LeaveDocumentRepository;
import com.smartleave.hr.repository.LeavePolicyRepository;
import com.smartleave.hr.repository.LeaveRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeavePolicyRepository leavePolicyRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveDocumentRepository leaveDocumentRepository;
    private final NotificationService notificationService;
    private final LeaveBalanceService leaveBalanceService;

    public LeaveService(
            LeaveRequestRepository leaveRequestRepository,
            LeavePolicyRepository leavePolicyRepository,
            EmployeeRepository employeeRepository,
            LeaveDocumentRepository leaveDocumentRepository,
            NotificationService notificationService,
            LeaveBalanceService leaveBalanceService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leavePolicyRepository = leavePolicyRepository;
        this.employeeRepository = employeeRepository;
        this.leaveDocumentRepository = leaveDocumentRepository;
        this.notificationService = notificationService;
        this.leaveBalanceService = leaveBalanceService;
    }

    public static int calculateWorkingDays(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || endDate.isBefore(startDate)) {
            return 0;
        }
        int workingDays = 0;
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                workingDays++;
            }
            current = current.plusDays(1);
        }
        return workingDays;
    }

    @Transactional
    public LeaveResponse applyLeave(LeaveApplyRequest request, Employee applicant) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be on or after the start date.");
        }
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Leave start date cannot be in the past.");
        }

        int numberOfDays = calculateWorkingDays(request.getStartDate(), request.getEndDate());
        if (numberOfDays <= 0) {
            throw new BadRequestException("Selected date range falls entirely on non-working weekend days.");
        }

        boolean hasOverlap = leaveRequestRepository.existsOverlappingLeave(
                applicant.getId(),
                request.getStartDate(),
                request.getEndDate(),
                List.of(LeaveStatus.PENDING, LeaveStatus.APPROVED)
        );
        if (hasOverlap) {
            throw new ConflictException("You already have a pending or approved leave request overlapping these dates.");
        }

        LeavePolicy policy = leavePolicyRepository.findByLeaveType(request.getLeaveType())
                .orElseThrow(() -> new BadRequestException("No leave policy configured for " + request.getLeaveType()));

        if (!Boolean.TRUE.equals(policy.getIsActive())) {
            throw new BadRequestException(policy.getDisplayName() + " is currently inactive.");
        }

        int leaveYear = request.getStartDate().getYear();
        LeaveBalanceResponse currentBalance = leaveBalanceService.computeAndSyncBalance(applicant.getId(), leaveYear);
        LeaveBalanceResponse.BalanceItem balanceForType = switch (request.getLeaveType()) {
            case CASUAL -> currentBalance.getCasual();
            case SICK -> currentBalance.getSick();
            case EARNED -> currentBalance.getEarned();
            case UNPAID -> currentBalance.getUnpaid();
        };

        int availableDays = Math.max(0, balanceForType.getRemaining() - balanceForType.getPending());
        if (numberOfDays > availableDays && request.getLeaveType() != LeaveType.UNPAID) {
            throw new BadRequestException(
                    "Insufficient " + policy.getDisplayName() + " balance. Available: "
                            + availableDays + " day(s), requested: " + numberOfDays + " day(s)."
            );
        }

        LeaveRequest entity = new LeaveRequest();
        entity.setApplicationId(generateApplicationCode(leaveYear));
        entity.setEmployee(applicant);
        entity.setLeavePolicy(policy);
        entity.setLeaveType(request.getLeaveType());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        entity.setNumberOfDays(numberOfDays);
        entity.setReason(request.getReason().trim());
        entity.setSupportingDocumentName(
                request.getSupportingDocumentName() != null && !request.getSupportingDocumentName().isBlank()
                        ? request.getSupportingDocumentName().trim()
                        : null
        );
        entity.setAppliedDate(LocalDate.now());
        entity.setStatus(LeaveStatus.PENDING);

        LeaveRequest saved = leaveRequestRepository.save(entity);
        leaveBalanceService.syncBalanceForType(applicant, request.getLeaveType(), leaveYear);

        Long managerRecipientId = applicant.getReportingManager() != null
                ? applicant.getReportingManager().getId()
                : null;
        String targetRole = managerRecipientId != null ? "MANAGER" : "ADMIN";
        String actionUrl = managerRecipientId != null ? "/manager/approvals" : "/admin/leaves";

        notificationService.createNotification(
                "New Leave Application",
                applicant.getFullName() + " requested " + numberOfDays + " working day(s) of "
                        + policy.getDisplayName() + " (" + request.getStartDate() + " to " + request.getEndDate() + ").",
                NotificationCategory.LEAVE_APPLIED,
                targetRole,
                managerRecipientId,
                actionUrl
        );

        return toResponse(saved);
    }

    public List<LeaveResponse> getAllLeaves(Employee current) {
        if (current.getRole() == UserRole.ADMIN) {
            return leaveRequestRepository.findAllByOrderByAppliedDateDescIdDesc()
                    .stream().map(this::toResponse).toList();
        }
        if (current.getRole() == UserRole.MANAGER) {
            return leaveRequestRepository.findByEmployeeReportingManagerIdOrderByAppliedDateDescIdDesc(current.getId())
                    .stream().map(this::toResponse).toList();
        }
        throw new AccessDeniedException("Only administrators and managers can view organization or team leave requests.");
    }

    public PagedResponse<LeaveResponse> searchPaged(
            Employee current,
            int page,
            int size,
            LeaveStatus status,
            LeaveType leaveType,
            String departmentName,
            String search) {
        if (current.getRole() != UserRole.ADMIN && current.getRole() != UserRole.MANAGER) {
            throw new AccessDeniedException("Only administrators and managers can view organization or team leave requests.");
        }
        Long managerScopeId = current.getRole() == UserRole.MANAGER ? current.getId() : null;
        int safePage = Math.max(0, page - 1);
        int safeSize = Math.min(Math.max(1, size), 100);
        String cleanDept = departmentName != null && !departmentName.isBlank() ? departmentName.trim() : null;
        String cleanSearch = search != null && !search.isBlank() ? search.trim() : null;

        Page<LeaveRequest> result = leaveRequestRepository.searchLeaves(
                null,
                managerScopeId,
                status,
                leaveType,
                cleanDept,
                null,
                null,
                cleanSearch,
                PageRequest.of(safePage, safeSize)
        );
        return PagedResponse.fromPage(result.map(this::toResponse));
    }

    public List<LeaveResponse> getMyLeaves(Employee current) {
        return leaveRequestRepository.findByEmployeeIdOrderByAppliedDateDescIdDesc(current.getId())
                .stream().map(this::toResponse).toList();
    }

    public PagedResponse<LeaveResponse> getMyPaged(
            Employee current,
            int page,
            int size,
            LeaveStatus status,
            LocalDate date,
            String search) {
        int safePage = Math.max(0, page - 1);
        int safeSize = Math.min(Math.max(1, size), 100);
        String cleanSearch = search != null && !search.isBlank() ? search.trim() : null;

        Page<LeaveRequest> result = leaveRequestRepository.searchLeaves(
                current.getId(),
                null,
                status,
                null,
                null,
                date,
                date,
                cleanSearch,
                PageRequest.of(safePage, safeSize)
        );
        return PagedResponse.fromPage(result.map(this::toResponse));
    }

    public LeaveResponse getById(Long id, Employee current) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave application not found with id: " + id));

        boolean isOwner = leave.getEmployee().getId().equals(current.getId());
        boolean isAdmin = current.getRole() == UserRole.ADMIN;
        boolean isReportingManager = current.getRole() == UserRole.MANAGER
                && leave.getEmployee().getReportingManager() != null
                && leave.getEmployee().getReportingManager().getId().equals(current.getId());

        if (!isOwner && !isAdmin && !isReportingManager) {
            throw new AccessDeniedException("You do not have permission to view this leave application.");
        }
        return toResponse(leave);
    }

    @Transactional
    public LeaveResponse approveLeave(Long id, Employee reviewer) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave application not found with id: " + id));

        enforceReviewPermission(leave, reviewer);

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Only pending leave requests can be approved.");
        }

        leave.setStatus(LeaveStatus.APPROVED);
        leave.setReviewedBy(reviewer.getFullName());
        leave.setReviewedDate(LocalDate.now());
        leave.setRejectionReason(null);

        LeaveRequest saved = leaveRequestRepository.save(leave);
        leaveBalanceService.syncBalanceForType(
                saved.getEmployee(),
                saved.getLeaveType(),
                saved.getStartDate().getYear()
        );

        notificationService.createNotification(
                "Leave Request Approved",
                "Application " + saved.getApplicationId() + " (" + saved.getLeaveType().name()
                        + ") was approved by " + reviewer.getFullName() + ".",
                NotificationCategory.LEAVE_APPROVED,
                "EMPLOYEE",
                saved.getEmployee().getId(),
                "/employee/requests"
        );

        return toResponse(saved);
    }

    @Transactional
    public LeaveResponse rejectLeave(Long id, String rejectionReason, Employee reviewer) {
        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new BadRequestException("A rejection reason is required.");
        }

        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave application not found with id: " + id));

        enforceReviewPermission(leave, reviewer);

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Only pending leave requests can be rejected.");
        }

        String cleanReason = rejectionReason.trim();
        leave.setStatus(LeaveStatus.REJECTED);
        leave.setReviewedBy(reviewer.getFullName());
        leave.setReviewedDate(LocalDate.now());
        leave.setRejectionReason(cleanReason);

        LeaveRequest saved = leaveRequestRepository.save(leave);
        leaveBalanceService.syncBalanceForType(
                saved.getEmployee(),
                saved.getLeaveType(),
                saved.getStartDate().getYear()
        );

        notificationService.createNotification(
                "Leave Request Rejected",
                "Application " + saved.getApplicationId() + " was rejected by "
                        + reviewer.getFullName() + ": \"" + cleanReason + "\"",
                NotificationCategory.LEAVE_REJECTED,
                "EMPLOYEE",
                saved.getEmployee().getId(),
                "/employee/requests"
        );

        return toResponse(saved);
    }

    @Transactional
    public LeaveBalanceResponse getBalanceForEmployee(Long employeeId, Employee current) {
        return getBalanceForEmployee(employeeId, null, current);
    }

    @Transactional
    public LeaveBalanceResponse getBalanceForEmployee(Long employeeId, Integer year, Employee current) {
        Employee target = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        boolean isSelf = target.getId().equals(current.getId());
        boolean isAdmin = current.getRole() == UserRole.ADMIN;
        boolean isReportingManager = current.getRole() == UserRole.MANAGER
                && target.getReportingManager() != null
                && target.getReportingManager().getId().equals(current.getId());

        if (!isSelf && !isAdmin && !isReportingManager) {
            throw new AccessDeniedException("You do not have permission to view this employee's leave balance.");
        }

        return computeBalance(employeeId, year);
    }

    @Transactional
    public LeaveBalanceResponse computeBalance(Long employeeId) {
        return computeBalance(employeeId, null);
    }

    @Transactional
    public LeaveBalanceResponse computeBalance(Long employeeId, Integer year) {
        int targetYear = year != null ? year : leaveBalanceService.getCurrentYear();
        return leaveBalanceService.computeAndSyncBalance(employeeId, targetYear);
    }

    private void enforceReviewPermission(LeaveRequest leave, Employee reviewer) {
        if (leave.getEmployee().getId().equals(reviewer.getId()) && reviewer.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("You cannot approve or reject your own leave application.");
        }
        boolean isAdmin = reviewer.getRole() == UserRole.ADMIN;
        boolean isReportingManager = reviewer.getRole() == UserRole.MANAGER
                && leave.getEmployee().getReportingManager() != null
                && leave.getEmployee().getReportingManager().getId().equals(reviewer.getId());

        if (!isAdmin && !isReportingManager) {
            throw new AccessDeniedException("You do not have permission to review this leave application.");
        }
    }

    private String generateApplicationCode(int year) {
        long count = leaveRequestRepository.count() + 1;
        return String.format("LR-%d-%04d", year, count);
    }

    public LeaveResponse toResponse(LeaveRequest r) {
        LeaveResponse res = new LeaveResponse();
        res.setId(r.getId());
        res.setApplicationId(r.getApplicationId());
        res.setEmployeeId(r.getEmployee().getId());
        res.setEmployeeCode(r.getEmployee().getEmployeeId());
        res.setEmployeeName(r.getEmployee().getFullName());
        res.setDepartmentName(r.getEmployee().getDepartment().getName());
        res.setDesignation(r.getEmployee().getDesignation());
        res.setLeaveType(r.getLeaveType());
        res.setStartDate(r.getStartDate());
        res.setEndDate(r.getEndDate());
        res.setNumberOfDays(r.getNumberOfDays());
        res.setReason(r.getReason());
        res.setSupportingDocumentName(r.getSupportingDocumentName());
        res.setHasSupportingDocument(leaveDocumentRepository.existsByLeaveRequestId(r.getId()));
        res.setAppliedDate(r.getAppliedDate());
        res.setStatus(r.getStatus());
        res.setReviewedBy(r.getReviewedBy());
        res.setReviewedDate(r.getReviewedDate());
        res.setRejectionReason(r.getRejectionReason());
        return res;
    }
}
