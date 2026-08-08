package com.enera.backend.repository;

import com.enera.backend.entity.Block;
import com.enera.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
