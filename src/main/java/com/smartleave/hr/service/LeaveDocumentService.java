package com.smartleave.hr.service;

import com.smartleave.hr.exception.BadRequestException;
import com.smartleave.hr.exception.ResourceNotFoundException;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.LeaveDocument;
import com.smartleave.hr.model.LeaveRequest;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.LeaveDocumentRepository;
import com.smartleave.hr.repository.LeaveRequestRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Service
public class LeaveDocumentService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "png", "jpg", "jpeg", "doc", "docx"
    );
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final LeaveDocumentRepository leaveDocumentRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public LeaveDocumentService(
            LeaveDocumentRepository leaveDocumentRepository,
            LeaveRequestRepository leaveRequestRepository) {
        this.leaveDocumentRepository = leaveDocumentRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    @Transactional
    public LeaveDocument uploadDocument(Long leaveRequestId, MultipartFile file, Employee current) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave application not found with id: " + leaveRequestId));

        boolean isOwner = leave.getEmployee().getId().equals(current.getId());
        boolean isAdmin = current.getRole() == UserRole.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to attach documents to this leave application.");
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Supporting document file cannot be empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Supporting document must be 5 MB or smaller.");
        }

        String rawName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String baseName = Paths.get(rawName).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
        String ext = extractExtension(baseName);

        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("Unsupported file type. Allowed formats: PDF, PNG, JPG, DOC, DOCX.");
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        if (!contentType.isEmpty() && !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Unsupported document content type: " + contentType);
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new BadRequestException("Unable to read uploaded document.");
        }

        LeaveDocument doc = leaveDocumentRepository.findByLeaveRequestId(leaveRequestId)
                .orElseGet(LeaveDocument::new);
        doc.setLeaveRequest(leave);
        doc.setOriginalFilename(baseName);
        doc.setStoredFilename(UUID.randomUUID() + "_" + baseName);
        doc.setContentType(!contentType.isEmpty() ? contentType : "application/octet-stream");
        doc.setFileSize(file.getSize());
        doc.setFileData(bytes);
        doc.setUploadedAt(Instant.now());

        LeaveDocument saved = leaveDocumentRepository.save(doc);
        leave.setSupportingDocumentName(baseName);
        leaveRequestRepository.save(leave);

        return saved;
    }

    @Transactional(readOnly = true)
    public LeaveDocument getDocumentForDownload(Long leaveRequestId, Employee current) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave application not found with id: " + leaveRequestId));

        boolean isOwner = leave.getEmployee().getId().equals(current.getId());
        boolean isAdmin = current.getRole() == UserRole.ADMIN;
        boolean isReportingManager = current.getRole() == UserRole.MANAGER
                && leave.getEmployee().getReportingManager() != null
                && leave.getEmployee().getReportingManager().getId().equals(current.getId());

        if (!isOwner && !isAdmin && !isReportingManager) {
            throw new AccessDeniedException("You do not have permission to download this supporting document.");
        }

        return leaveDocumentRepository.findByLeaveRequestId(leaveRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("No supporting document uploaded for this leave application."));
    }

    private String extractExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx < 0 || idx == filename.length() - 1) {
            return "";
        }
        return filename.substring(idx + 1).toLowerCase();
    }
}
