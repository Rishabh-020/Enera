package com.enera.backend.repository;

import com.enera.backend.entity.Device;
import com.enera.backend.entity.Reading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingRepository extends JpaRepository<Reading,Long> {
    List<Reading> findByDevice(Device device);

    List<Reading> findByDeviceAndTimestampBetween(Device device,LocalDateTime start,LocalDateTime end);

    // This is the method which is suggested by AI, I want your reviews too on this one.
    Optional<Reading> findTopByDeviceOrderByTimestampDesc(Device device);

    List<Reading> findByTimestampAfter(LocalDateTime timestamp);

    List<Reading> findByTimestampBefore(LocalDateTime timestamp);

    @Query("""
    SELECT COALESCE(SUM(r.kwh), 0)
    FROM Reading r
    JOIN r.device d
    JOIN d.society s
    WHERE s.builder.id = :builderId
      AND r.timestamp BETWEEN :startDate AND :endDate
    """)
    Double getMonthKwh(
            @Param("builderId") Long builderId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
    // Param is used to define the parameter what we are using

    @Query("""
    SELECT COALESCE(SUM(r.kwh), 0)
    FROM Reading r
    JOIN r.device d
    JOIN d.society s
    WHERE s.id = :societyId
      AND r.timestamp BETWEEN :startDate AND :endDate
    """)
    Double getMonthKwhBySociety(
            @Param("societyId") Long societyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
