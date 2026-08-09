package com.enera.backend.repository;

import com.enera.backend.entity.CommonArea;
import com.enera.backend.entity.Device;
import com.enera.backend.entity.Flat;
import com.enera.backend.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device,Long> {
    List<Device> findByDeviceType(String deviceType);

    List<Device> findByFlat(Flat flat);

    List<Device> findByCommonArea(CommonArea commonArea);

    List<Device> findByFlatAndCommonArea(Flat flat,CommonArea commonArea);

    List<Device> findBySocietyAndCommonArea(Society society,CommonArea  commonArea);

    boolean existsBySocietyAndCommonAreaAndFlat(Society society,CommonArea  commonArea,Flat flat);

    Optional<Device> findByFlatId(Long flatId);

    Integer countBySocietyBuilderIdAndStatus(Long builderId,Boolean online);

    Integer countBySocietyIdAndStatus(Long societyId,Boolean online);

    @Query(value = """
    SELECT d.status
    FROM devices d
    WHERE d.mapped_flat_id = :flatId
    ORDER BY d.last_seen_at DESC NULLS LAST
    LIMIT 1
    """, nativeQuery = true)
    Boolean getStatusByFlatId(
            @Param("flatId") Long flatId);
}
