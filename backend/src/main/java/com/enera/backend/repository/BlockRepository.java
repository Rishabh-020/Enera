package com.enera.backend.repository;

import com.enera.backend.entity.Block;
import com.enera.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BlockRepository extends JpaRepository<Block,Long> {
    Optional<Block> findBySociety(Society society);

    boolean existsBySociety(Society society);

    List<Block> findByBlockName(String blockName);

    boolean existsByBlockName(String name);

    List<Block> findBySocietyId(Long societyId);

    Integer countBySocietyBuilderId(Long builderId);

    @Query(value = """
        SELECT
        b.id AS id,
        b.block_name AS blockName,
        COALESCE(fc.flat_count, 0) AS flatCount,
        COALESCE(mtd.total_kwh, 0.0) AS mtdKwh,
        COALESCE(live.live_kw, 0.0) AS liveKw
        FROM blocks b
        LEFT JOIN (
                SELECT fl.block_id, COUNT(f.id) AS flat_count
        FROM flats f
        JOIN floors fl ON f.floor_id = fl.id
        GROUP BY fl.block_id
    ) fc ON fc.block_id = b.id
        LEFT JOIN (
                SELECT fl.block_id, SUM(r.kwh) AS total_kwh
        FROM readings r
        JOIN devices d ON r.device_id = d.id
        JOIN flats f ON d.mapped_flat_id = f.id
        JOIN floors fl ON f.floor_id = fl.id
        WHERE r.timestamp >= :startDate
        GROUP BY fl.block_id
    ) mtd ON mtd.block_id = b.id
        LEFT JOIN (
                SELECT fl.block_id, SUM(latest.kw) AS live_kw
        FROM (
                SELECT DISTINCT ON (r.device_id) r.device_id, r.kw
        FROM readings r
        JOIN devices d ON r.device_id = d.id
        WHERE d.society_id = :societyId
        ORDER BY r.device_id, r.timestamp DESC
        ) latest
        JOIN devices d ON latest.device_id = d.id
        JOIN flats f ON d.mapped_flat_id = f.id
        JOIN floors fl ON f.floor_id = fl.id
        GROUP BY fl.block_id
    ) live ON live.block_id = b.id
        WHERE b.society_id = :societyId
        ORDER BY b.block_name ASC;
        """, nativeQuery = true)
    List<SocietyBlockProjection> findBlocksWithStatsBySocietyId(
            @Param("societyId") Long societyId,
            @Param("startDate") LocalDateTime startDate
    );

}
