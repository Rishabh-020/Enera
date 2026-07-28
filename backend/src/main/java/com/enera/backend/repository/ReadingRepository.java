package com.enera.backend.repository;

import com.enera.backend.entity.Device;
import com.enera.backend.entity.Reading;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
