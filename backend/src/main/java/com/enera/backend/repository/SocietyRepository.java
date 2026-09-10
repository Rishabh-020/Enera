package com.enera.backend.repository;

import com.enera.backend.entity.Builder;
import com.enera.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;


@Repository
public interface SocietyRepository extends JpaRepository<Society,Long> {
    List<Society> findByBuilder(Builder builder);

    List<Society> findByCity(String city);

    Optional<Society> findByBuilderAndName(Builder builder, String name);

    Optional<Society> findFirstByBuilderAndName(Builder builder, String name);

    Optional<Society> findFirstByBuilderAndNameOrderByIdAsc(Builder builder, String name);

    boolean existsByBuilderAndName(Builder builder, String name);

    Integer countByBuilderId(Long builderId);

    List<Society> findByBuilderId(Long builderId);
    @Query(value = """
        SELECT 
            s.id AS id,
            s.name AS name,
            s.city AS city,
            COALESCE(fc.total_flats, 0) AS totalFlats,
            COALESCE(fc.occupied_flats, 0) AS occupiedFlats,
            COALESCE(mtd.mtd_kwh, 0.0) AS mtdKwh,
            COALESCE(prev.prev_kwh, 0.0) AS prevMonthKwh
        FROM societies s
        LEFT JOIN (
            SELECT b.society_id, 
                   COUNT(f.id) AS total_flats,
                   COUNT(CASE WHEN f.status = true THEN 1 END) AS occupied_flats
            FROM flats f
            JOIN floors fl ON f.floor_id = fl.id
            JOIN blocks b ON fl.block_id = b.id
            GROUP BY b.society_id
        ) fc ON fc.society_id = s.id
        LEFT JOIN (
            SELECT d.society_id, SUM(r.kwh) AS mtd_kwh
            FROM readings r
            JOIN devices d ON r.device_id = d.id
            WHERE r.timestamp >= :startDate AND r.timestamp <= :endDate
            GROUP BY d.society_id
        ) mtd ON mtd.society_id = s.id
        LEFT JOIN (
            SELECT d.society_id, SUM(r.kwh) AS prev_kwh
            FROM readings r
            JOIN devices d ON r.device_id = d.id
            WHERE r.timestamp >= :prevStartDate AND r.timestamp <= :prevEndDate
            GROUP BY d.society_id
        ) prev ON prev.society_id = s.id
        WHERE s.builder_id = :builderId
        ORDER BY s.name ASC
    """, nativeQuery = true)
    List<BuilderSocietyProjection> findSocietiesWithStatsByBuilderId(
            @Param("builderId") Long builderId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("prevStartDate") LocalDateTime prevStartDate,
            @Param("prevEndDate") LocalDateTime prevEndDate
    );

}
