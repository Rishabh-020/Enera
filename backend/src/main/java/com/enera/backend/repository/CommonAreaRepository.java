package com.enera.backend.repository;

import com.enera.backend.entity.CommonArea;
import com.enera.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommonAreaRepository extends JpaRepository<CommonArea,Long> {
    List<CommonArea> findByCategory(String category);

    List<CommonArea> findByName(String name);

    List<CommonArea> findBySocietyAndCategory(Society society, String category);

    Optional<CommonArea> findBySocietyAndName(Society society, String name);

    List<CommonArea> findBySocietyId(Long societyId);

    @Query(value = """
        SELECT 
            ca.id AS id,
            ca.name AS name,
            ca.category AS category,
            ca.floor_or_location AS floorOrLocation,
            COALESCE(live.live_kw, 0.0) AS currentKw
        FROM common_areas ca
        LEFT JOIN (
            SELECT d.mapped_common_area_id, SUM(latest.kw) AS live_kw
            FROM (
                SELECT DISTINCT ON (r.device_id) r.device_id, r.kw
                FROM readings r
                JOIN devices d ON r.device_id = d.id
                WHERE d.society_id = :societyId AND d.mapped_common_area_id IS NOT NULL
                ORDER BY r.device_id, r.timestamp DESC
            ) latest
            JOIN devices d ON latest.device_id = d.id
            GROUP BY d.mapped_common_area_id
        ) live ON live.mapped_common_area_id = ca.id
        WHERE ca.society_id = :societyId
        ORDER BY ca.name ASC
    """, nativeQuery = true)
    List<SocietyCommonAreaProjection> findCommonAreasWithLiveKwBySocietyId(
            @Param("societyId") Long societyId
    );


//    The naming issue is causing server to crash
//    boolean existsBySocietyAndNameAndFloorOrLocation(Society society,
//                                                     String name, String floorOrLocation);
}
