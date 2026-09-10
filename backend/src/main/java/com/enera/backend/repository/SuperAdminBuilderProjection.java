package com.enera.backend.repository;

public interface SuperAdminBuilderProjection {
    Long getId();

    String getName();

    String getEmail();

    Integer getTotalSocieties();

    Integer getTotalFlats();

    Double getLiveKw();

    Double getMtdKwh();
}
