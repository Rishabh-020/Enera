package com.enera.backend.repository;

public interface SocietyBlockProjection {
    Long getId();

    String getBlockName();

    Double getMtdKwh();

    Double getLiveKw();

    Long getFlatCount();
}
