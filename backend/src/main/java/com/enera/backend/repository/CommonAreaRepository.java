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

//    The naming issue is causing server to crash
//    boolean existsBySocietyAndNameAndFloorOrLocation(Society society,
//                                                     String name, String floorOrLocation);
}
