package com.enera.backend.repository;

import com.enera.backend.entity.CommonArea;
import com.enera.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommonAreaRepository extends JpaRepository<CommonArea,Long> {
    List<CommonArea> findBySociety(Society society);

    List<CommonArea> findByCategory(String category);

    List<CommonArea> findByName(String name);

    List<CommonArea> findBySocietyAndCategory(Society society, String category);

    Optional<CommonArea> findBySocietyAndName(Society society, String name);

//    The naming issue is causing server to crash
//    boolean existsBySocietyAndNameAndFloorOrLocation(Society society,
//                                                     String name, String floorOrLocation);
}
