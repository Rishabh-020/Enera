package com.enera.backend.repository;

import com.enera.backend.entity.Flat;
import com.enera.backend.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
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

}
