package com.enera.backend.repository;

import com.enera.backend.entity.Flat;
import com.enera.backend.entity.Floor;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlatRepository extends JpaRepository<Flat,Long> {
    List<Flat> findByFloor(Floor floor);

    List<Flat> findByBhkType(String bhkType);

    // can be good if we want to find a particular bhkType on a floor
    List<Flat> findByFloorAndBhkType(Floor floor,String bhkType);

    List<Flat> findByFloorAndStatus(Floor floor, boolean status);

    boolean existsByFloorAndFlatNumber(Floor floor,String flatNumber);

    Integer countByFloorBlockSocietyId(Long societyId);

    Integer countByFloorBlockSocietyIdAndStatus(Long societyId,boolean occupied);

    List<Flat> findByFloorId(Long floorId);

    @Query("""
    SELECT COUNT(f)
    FROM Flat f
    WHERE f.floor.id = :floorId
    """)
    Long countByFloorId(@Param("floorId") Long floorId);

    List<Flat> findByFloorBlockId(Long blockId);

    @Query("""
    SELECT COUNT(f)
    FROM Flat f
    WHERE f.floor.block.id = :blockId
    """)
    Long countByFloorBlockId(@Param("blockId") Long blockId);

    List<Flat> findByFloorBlockSocietyId(Long societyId);

    Integer countByFloorBlockSocietyBuilderId(Long builderId);

    @Query(value = """
        SELECT 
            f.id AS id,
            f.flat_number AS flatNumber,
            f.bhk_type AS bhkType,
            f.status AS status,
            u.id AS residentId,
            u.name AS residentName,
            u.email AS residentEmail,
            b.block_name AS blockName,
            fl.floor_number AS floorNumber,
            COALESCE(r.total_kwh, 0.0) AS mtdKwh,
            COALESCE(d.status, false) AS deviceOnline
        FROM flats f
        JOIN floors fl ON f.floor_id = fl.id
        JOIN blocks b ON fl.block_id = b.id
        LEFT JOIN (
            SELECT DISTINCT ON (u_inner.flat_id) 
                u_inner.id, u_inner.name, u_inner.email, u_inner.flat_id
            FROM users u_inner
            WHERE u_inner.role = 'RESIDENT'
            ORDER BY u_inner.flat_id, u_inner.id DESC
        ) u ON u.flat_id = f.id
        LEFT JOIN (
            SELECT DISTINCT ON (d_inner.mapped_flat_id) 
                d_inner.id, d_inner.status, d_inner.mapped_flat_id
            FROM devices d_inner
            WHERE d_inner.mapped_flat_id IS NOT NULL
            ORDER BY d_inner.mapped_flat_id, d_inner.id DESC
        ) d ON d.mapped_flat_id = f.id
        LEFT JOIN (
            SELECT d2.mapped_flat_id, SUM(rd.kwh) AS total_kwh
            FROM readings rd
            JOIN devices d2 ON rd.device_id = d2.id
            WHERE rd.timestamp >= :startDate AND rd.timestamp <= :endDate
            GROUP BY d2.mapped_flat_id
        ) r ON r.mapped_flat_id = f.id
        WHERE b.society_id = :societyId
        ORDER BY b.block_name ASC, fl.floor_number ASC, f.flat_number ASC
    """, nativeQuery = true)
    List<SocietyFlatProjection> findFlatsWithDetailsBySocietyId(
            @Param("societyId") Long societyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}

