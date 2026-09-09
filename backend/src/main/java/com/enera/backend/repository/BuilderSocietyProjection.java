package com.enera.backend.repository;

public interface BuilderSocietyProjection {
    Long getId();

    String getName();

    String getCity();

    Integer getTotalFlats();

    Integer getOccupiedFlats();

    Double getMtdKwh();

    Double getPrevMonthKwh();
}

