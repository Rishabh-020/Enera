package com.enera.backend.repository;

import com.enera.backend.entity.Block;
import com.enera.backend.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FloorRepository extends JpaRepository<Floor,Long> {
    List<Floor> findByFloorNumber(Long floorNumber);

    List<Floor> findByBlock(Block block);

    Optional<Floor> findByBlockAndFloorNumber(Block block, Long floorNumber);

    boolean existsByBlockAndFloorNumber(Block block, Long floorNumber);
}
