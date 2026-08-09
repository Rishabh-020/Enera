package com.enera.backend.repository;

import com.enera.backend.entity.Flat;
import com.enera.backend.entity.Floor;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
