package com.smartleave.hr.dto;

public class BootstrapStatusResponse {
    private boolean needsAdminBootstrap;

    public BootstrapStatusResponse(boolean needsAdminBootstrap) {
        this.needsAdminBootstrap = needsAdminBootstrap;
    }

    public boolean isNeedsAdminBootstrap() { return needsAdminBootstrap; }
    public void setNeedsAdminBootstrap(boolean needsAdminBootstrap) { this.needsAdminBootstrap = needsAdminBootstrap; }
}
