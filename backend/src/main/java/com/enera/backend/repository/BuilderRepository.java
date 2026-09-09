package com.enera.backend.repository;

import com.enera.backend.entity.Builder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BuilderRepository extends JpaRepository<Builder,Long> {
    Optional<Builder> findByEmail(String email);

    Optional<Builder> findFirstByEmail(String email);

    boolean existsByEmail(String email);

    @Query(value = """
        SELECT 
            b.id AS id,
            b.name AS name,
            b.email AS email,
            COALESCE(soc.total_societies, 0) AS totalSocieties,
            COALESCE(fc.total_flats, 0) AS totalFlats,
            COALESCE(live.live_kw, 0.0) AS liveKw,
            COALESCE(mtd.mtd_kwh, 0.0) AS mtdKwh
        FROM builders b
        LEFT JOIN (
            SELECT s.builder_id, COUNT(s.id) AS total_societies
            FROM societies s
            GROUP BY s.builder_id
        ) soc ON soc.builder_id = b.id
        LEFT JOIN (
            SELECT s.builder_id, COUNT(f.id) AS total_flats
            FROM flats f
            JOIN floors fl ON f.floor_id = fl.id
            JOIN blocks bl ON fl.block_id = bl.id
            JOIN societies s ON bl.society_id = s.id
            GROUP BY s.builder_id
        ) fc ON fc.builder_id = b.id
        LEFT JOIN (
            SELECT s.builder_id, SUM(r.kwh) AS mtd_kwh
            FROM readings r
            JOIN devices d ON r.device_id = d.id
            JOIN societies s ON d.society_id = s.id
            WHERE r.timestamp >= :startDate AND r.timestamp <= :endDate
            GROUP BY s.builder_id
        ) mtd ON mtd.builder_id = b.id
        LEFT JOIN (
            SELECT s.builder_id, SUM(r.kw) AS live_kw
            FROM readings r
            JOIN devices d ON r.device_id = d.id
            JOIN societies s ON d.society_id = s.id
            WHERE r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
            GROUP BY s.builder_id
        ) live ON live.builder_id = b.id
        ORDER BY b.name ASC
    """, nativeQuery = true)
    List<SuperAdminBuilderProjection> findBuildersWithStats(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}

