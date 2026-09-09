package com.enera.backend.repository;

public interface SocietyFlatProjection {
    Long getId();

    String getFlatNumber();
    
    String getBhkType();
    
    Boolean getStatus();
    
    Long getResidentId();
    
    String getResidentName();
    
    String getResidentEmail();
    
    String getBlockName();
    
    Long getFloorNumber();
    
    Double getMtdKwh();
    
    Boolean getDeviceOnline();
}
