package com.enera.backend.repository;

import com.enera.backend.entity.Device;
import com.enera.backend.entity.Reading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingRepository extends JpaRepository<Reading,Long> {
    List<Reading> findByDevice(Device device);

    List<Reading> findByDeviceAndTimestampBetween(Device device,LocalDateTime start,LocalDateTime end);

    // This is the method which is suggested by AI, I want your reviews too on this one.
    Optional<Reading> findTopByDeviceOrderByTimestampDesc(Device device);

    List<Reading> findByTimestampAfter(LocalDateTime timestamp);

    List<Reading> findByTimestampBefore(LocalDateTime timestamp);

    Optional<Reading> findTopByDevice_Flat_IdOrderByTimestampDesc(Long flatId);

    @Query(value = """
        SELECT r.*
        FROM readings r
        JOIN devices d ON r.device_id = d.id
        WHERE d.mapped_flat_id = :flatId
        ORDER BY r.timestamp DESC
        LIMIT 1
        """, nativeQuery = true)
    Optional<Reading> findLatestReadingByFlatId(@Param("flatId") Long flatId);

    @Query("""
    SELECT COALESCE(SUM(r.kwh), 0)
    FROM Reading r
    JOIN r.device d
    JOIN d.society s
    WHERE s.builder.id = :builderId
      AND r.timestamp BETWEEN :startDate AND :endDate
    """)
    Double getMonthKwh(
            @Param("builderId") Long builderId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
    // Param is used to define the parameter what we are using

    @Query("""
    SELECT COALESCE(SUM(r.kwh), 0)
    FROM Reading r
    JOIN r.device d
    JOIN d.society s
    WHERE s.id = :societyId
      AND r.timestamp BETWEEN :startDate AND :endDate
    """)
    Double getMonthKwhBySociety(
            @Param("societyId") Long societyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query(value = """
    SELECT COALESCE(SUM(r.kw), 0)
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    WHERE d.society_id = :societyId
    AND r.timestamp = (
        SELECT MAX(r2.timestamp)
        FROM readings r2
        WHERE r2.device_id = r.device_id
    )
    """, nativeQuery = true)
    Double getLiveKwBySocietyId(@Param("societyId") Long societyId);


    @Query(value = """
    SELECT COALESCE(SUM(r.kwh), 0)
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN flats f ON d.mapped_flat_id = f.id
    JOIN floors fl ON f.floor_id = fl.id
    WHERE fl.block_id = :blockId
    AND r.timestamp >= DATE_TRUNC('month', CURRENT_DATE)
    """, nativeQuery = true)
    Double getMonthKwhBySocietyBlockId(
            @Param("blockId") Long blockId);

    @Query(value = """
    SELECT COALESCE(SUM(r.kw), 0)
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN flats f ON d.mapped_flat_id = f.id
    JOIN floors fl ON f.floor_id = fl.id
    WHERE fl.block_id = :blockId
    AND r.timestamp = (
        SELECT MAX(r2.timestamp)
        FROM readings r2
        WHERE r2.device_id = r.device_id
    )
    """, nativeQuery = true)
    Double getLiveKwBySocietyBlockId(
            @Param("blockId") Long blockId);

    @Query(value = """
    SELECT COALESCE(AVG(r.kwh), 0)
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN flats f ON d.mapped_flat_id = f.id
    JOIN floors fl ON f.floor_id = fl.id
    WHERE fl.block_id = :blockId
    AND r.timestamp >= DATE_TRUNC('month', CURRENT_DATE)
    """, nativeQuery = true)
    Double getAverageKwhBySocietyBlockId(
            @Param("blockId") Long blockId);

    @Query(value = """
    SELECT COALESCE(SUM(r.kw), 0)
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    WHERE d.mapped_common_area_id = :commonAreaId
    AND r.timestamp = (
        SELECT MAX(r2.timestamp)
        FROM readings r2
        WHERE r2.device_id = r.device_id
    )
    """, nativeQuery = true)
    Double getCurrentKwByCommonAreaId(
            @Param("commonAreaId") Long commonAreaId);

    @Query(value = """
    SELECT
        EXTRACT(DOW FROM r.timestamp) AS day_of_week,
        EXTRACT(HOUR FROM r.timestamp) AS hour,
        AVG(r.kw) AS average_kw
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    WHERE d.society_id = :societyId
      AND r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '28 days'
    GROUP BY EXTRACT(DOW FROM r.timestamp), EXTRACT(HOUR FROM r.timestamp)
    ORDER BY day_of_week, hour
""", nativeQuery = true)
    List<Object[]> getSocietyHeatmap(@Param("societyId") Long societyId);

    @Query(value = """
    SELECT
        EXTRACT(DOW FROM r.timestamp) AS day_of_week,
        EXTRACT(HOUR FROM r.timestamp) AS hour,
        AVG(r.kw) AS average_kw
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN flats f ON d.mapped_flat_id = f.id
    JOIN floors fl ON f.floor_id = fl.id
    JOIN blocks b ON fl.block_id = b.id
    WHERE d.society_id = :societyId
      AND (b.block_name = :blockName OR CONCAT('Block ', b.block_name) = :blockName)
      AND r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '28 days'
    GROUP BY EXTRACT(DOW FROM r.timestamp), EXTRACT(HOUR FROM r.timestamp)
    ORDER BY day_of_week, hour
""", nativeQuery = true)
    List<Object[]> getSocietyHeatmapByBlock(@Param("societyId") Long societyId, @Param("blockName") String blockName);

    @Query(value = """
    SELECT
        EXTRACT(DOW FROM r.timestamp) AS day_of_week,
        EXTRACT(HOUR FROM r.timestamp) AS hour,
        AVG(r.kw) AS average_kw
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    WHERE d.society_id = :societyId
      AND d.mapped_common_area_id IS NOT NULL
      AND r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '28 days'
    GROUP BY EXTRACT(DOW FROM r.timestamp), EXTRACT(HOUR FROM r.timestamp)
    ORDER BY day_of_week, hour
""", nativeQuery = true)
    List<Object[]> getSocietyHeatmapCommonAreas(@Param("societyId") Long societyId);

    @Query(value = """
    SELECT COALESCE(SUM(r.kwh), 0)
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    WHERE d.mapped_flat_id = :flatId
    AND r.timestamp >= DATE_TRUNC('month', CURRENT_DATE)
    """, nativeQuery = true)
    Double getMonthKwhByFlatId(
            @Param("flatId") Long flatId);

    @Query(value = """
    SELECT COALESCE(SUM(r.kwh), 0)
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN flats f ON d.mapped_flat_id = f.id
    WHERE f.floor_id = :floorId
    AND r.timestamp >= DATE_TRUNC('month', CURRENT_DATE)
    """, nativeQuery = true)
    Double getMonthKwhByFloorId(
            @Param("floorId") Long floorId);

    @Query(value = """
        SELECT COALESCE(AVG(r.kw), 0.0)
        FROM readings r
        JOIN devices d ON r.device_id = d.id
        WHERE d.mapped_flat_id = :flatId
        """, nativeQuery = true)
    Double findAverageKwByFlatId(@Param("flatId") Long flatId);

    @Query(value = """
        SELECT r.*
        FROM readings r
        JOIN devices d ON r.device_id = d.id
        WHERE d.mapped_flat_id = :flatId
          AND r.timestamp >= :start
          AND r.timestamp < :end
        ORDER BY r.timestamp ASC
        """, nativeQuery = true)
    List<Reading> findReadingsForFlatAndPeriod(
            @Param("flatId") Long flatId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query(value = """
        SELECT r.*
        FROM readings r
        JOIN devices d ON r.device_id = d.id
        WHERE d.mapped_flat_id = :flatId
          AND r.timestamp >= :start
          AND r.timestamp < :end
        ORDER BY r.timestamp ASC
        """, nativeQuery = true)
    List<Reading> findReadingsForPeriod(
            @Param("flatId") Long flatId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query(value = """
        SELECT r.*
        FROM readings r
        JOIN devices d ON r.device_id = d.id
        WHERE d.mapped_flat_id = :flatId
          AND r.timestamp >= :start
          AND r.timestamp < :end
        ORDER BY r.timestamp ASC
        """, nativeQuery = true)
    List<Reading> findReadingsHourlyForPeriod(
            @Param("flatId") Long flatId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query(value = """
    SELECT 
        TO_CHAR(r.timestamp, 'DD Mon') AS day_str,
        COALESCE(SUM(r.kwh), 0) AS total_kwh,
        COALESCE(SUM(CASE WHEN d.mapped_common_area_id IS NOT NULL THEN r.kwh ELSE 0 END), 0) AS common_kwh
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    WHERE d.society_id = :societyId
      AND r.timestamp >= CURRENT_DATE - CAST(:days || ' days' AS INTERVAL)
    GROUP BY DATE_TRUNC('day', r.timestamp), TO_CHAR(r.timestamp, 'DD Mon')
    ORDER BY DATE_TRUNC('day', r.timestamp) ASC
    """, nativeQuery = true)
    List<Object[]> getDailyTrendBySociety(
            @Param("societyId") Long societyId,
            @Param("days") int days
    );

    @Query(value = """
    SELECT 
        TO_CHAR(r.timestamp, 'DD Mon') AS day_str,
        0.0 AS total_kwh,
        COALESCE(SUM(r.kwh), 0) AS common_kwh
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    WHERE d.society_id = :societyId
      AND d.mapped_common_area_id IS NOT NULL
      AND r.timestamp >= CURRENT_DATE - CAST(:days || ' days' AS INTERVAL)
    GROUP BY DATE_TRUNC('day', r.timestamp), TO_CHAR(r.timestamp, 'DD Mon')
    ORDER BY DATE_TRUNC('day', r.timestamp) ASC
""", nativeQuery = true)
    List<Object[]> getDailyTrendBySocietyCommonAreas(
            @Param("societyId") Long societyId,
            @Param("days") int days
    );

    @Query(value = """
    SELECT 
        TO_CHAR(r.timestamp, 'DD Mon') AS day_str,
        COALESCE(SUM(r.kwh), 0) AS total_kwh,
        0.0 AS common_kwh
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN flats f ON d.mapped_flat_id = f.id
    JOIN floors fl ON f.floor_id = fl.id
    JOIN blocks b ON fl.block_id = b.id
    WHERE d.society_id = :societyId
      AND (b.block_name = :blockName OR CONCAT('Block ', b.block_name) = :blockName)
      AND r.timestamp >= CURRENT_DATE - CAST(:days || ' days' AS INTERVAL)
    GROUP BY DATE_TRUNC('day', r.timestamp), TO_CHAR(r.timestamp, 'DD Mon')
    ORDER BY DATE_TRUNC('day', r.timestamp) ASC
""", nativeQuery = true)
    List<Object[]> getDailyTrendBySocietyBlock(
            @Param("societyId") Long societyId,
            @Param("days") int days,
            @Param("blockName") String blockName
    );


    @Query(value = """
        SELECT
            EXTRACT(HOUR FROM r.timestamp) AS hour_num,
            COALESCE(
                SUM(
                    CASE
                        WHEN d.mapped_flat_id IS NOT NULL
                        THEN r.kwh
                        ELSE 0
                    END
                ),
                0
            ) AS base_kwh,
            COALESCE(
                SUM(
                    CASE
                        WHEN d.mapped_common_area_id IS NOT NULL
                        THEN r.kwh
                        ELSE 0
                    END
                ),
                0
            ) AS common_area_kwh,
            COALESCE(
                MAX(r.kw),
                0
            ) AS peak_kw
        FROM readings r
        JOIN devices d
            ON r.device_id = d.id
        WHERE d.society_id = :societyId
          AND r.timestamp >= :startDate
          AND r.timestamp < :endDate
        GROUP BY EXTRACT(HOUR FROM r.timestamp)
        ORDER BY hour_num ASC
        """, nativeQuery = true)
    List<Object[]> getHourlyBreakdownByDate(
            @Param("societyId") Long societyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query(value = """
        SELECT
            EXTRACT(HOUR FROM r.timestamp) AS hour_num,
            COALESCE(SUM(r.kwh), 0) AS base_kwh,
            0.0 AS common_area_kwh,
            COALESCE(MAX(r.kw), 0) AS peak_kw
        FROM readings r
        JOIN devices d ON r.device_id = d.id
        JOIN flats f ON d.mapped_flat_id = f.id
        JOIN floors fl ON f.floor_id = fl.id
        JOIN blocks b ON fl.block_id = b.id
        WHERE d.society_id = :societyId
          AND (b.block_name = :blockName OR CONCAT('Block ', b.block_name) = :blockName)
          AND r.timestamp >= :startDate
          AND r.timestamp < :endDate
        GROUP BY EXTRACT(HOUR FROM r.timestamp)
        ORDER BY hour_num ASC
        """, nativeQuery = true)
    List<Object[]> getHourlyBreakdownByBlock(
            @Param("societyId") Long societyId,
            @Param("blockName") String blockName,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query(value = """
        SELECT
            EXTRACT(HOUR FROM r.timestamp) AS hour_num,
            0.0 AS base_kwh,
            COALESCE(SUM(r.kwh), 0) AS common_area_kwh,
            COALESCE(MAX(r.kw), 0) AS peak_kw
        FROM readings r
        JOIN devices d ON r.device_id = d.id
        WHERE d.society_id = :societyId
          AND d.mapped_common_area_id IS NOT NULL
          AND r.timestamp >= :startDate
          AND r.timestamp < :endDate
        GROUP BY EXTRACT(HOUR FROM r.timestamp)
        ORDER BY hour_num ASC
        """, nativeQuery = true)
    List<Object[]> getHourlyBreakdownByCommonAreas(
            @Param("societyId") Long societyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query(value = """
    SELECT
        EXTRACT(HOUR FROM r.timestamp) AS hour_num,
        COALESCE(SUM(CASE WHEN d.mapped_flat_id IS NOT NULL THEN r.kwh ELSE 0 END), 0) AS base_kwh,
        COALESCE(SUM(CASE WHEN d.mapped_common_area_id IS NOT NULL THEN r.kwh ELSE 0 END), 0) AS common_area_kwh,
        COALESCE(MAX(r.kw), 0) AS peak_kw
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN societies s ON d.society_id = s.id
    WHERE s.builder_id = :builderId
      AND r.timestamp >= :startDate
      AND r.timestamp < :endDate
    GROUP BY EXTRACT(HOUR FROM r.timestamp)
    ORDER BY hour_num ASC
    """, nativeQuery = true)
    List<Object[]> getHourlyBreakdownByBuilder(
            @Param("builderId") Long builderId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query(value = """
    SELECT 
        r.id AS reading_id,
        f.flat_number,
        b.block_name,
        r.kw AS current_kw,
        COALESCE(fb.avg_kw, 1.5) AS expected_kw,
        r.timestamp
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN flats f ON d.mapped_flat_id = f.id
    JOIN floors fl ON f.floor_id = fl.id
    JOIN blocks b ON fl.block_id = b.id
    LEFT JOIN (
        SELECT d2.mapped_flat_id AS flat_id, AVG(r2.kw) AS avg_kw
        FROM readings r2
        JOIN devices d2 ON r2.device_id = d2.id
        WHERE d2.society_id = :societyId
          AND r2.timestamp >= CURRENT_TIMESTAMP - INTERVAL '28 days'
        GROUP BY d2.mapped_flat_id
    ) fb ON fb.flat_id = f.id
    WHERE d.society_id = :societyId
      AND r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      AND r.kw >= 2.0
      AND r.kw >= (2.5 * COALESCE(fb.avg_kw, 1.5))
    ORDER BY r.timestamp DESC
    LIMIT 20
    """, nativeQuery = true)
    List<Object[]> findAnomaliesBySociety(@Param("societyId") Long societyId);

    @Query(value = """
    SELECT 
        r.id AS reading_id,
        f.flat_number,
        b.block_name,
        r.kw AS current_kw,
        COALESCE(fb.avg_kw, 1.5) AS expected_kw,
        r.timestamp
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN flats f ON d.mapped_flat_id = f.id
    JOIN floors fl ON f.floor_id = fl.id
    JOIN blocks b ON fl.block_id = b.id
    LEFT JOIN (
        SELECT d2.mapped_flat_id AS flat_id, AVG(r2.kw) AS avg_kw
        FROM readings r2
        JOIN devices d2 ON r2.device_id = d2.id
        WHERE d2.society_id = :societyId
          AND r2.timestamp >= CURRENT_TIMESTAMP - INTERVAL '28 days'
        GROUP BY d2.mapped_flat_id
    ) fb ON fb.flat_id = f.id
    WHERE d.society_id = :societyId
      AND (b.block_name = :blockName OR CONCAT('Block ', b.block_name) = :blockName)
      AND r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      AND r.kw >= 2.0
      AND r.kw >= (2.5 * COALESCE(fb.avg_kw, 1.5))
    ORDER BY r.timestamp DESC
    LIMIT 20
    """, nativeQuery = true)
    List<Object[]> findAnomaliesByBlock(@Param("societyId") Long societyId, @Param("blockName") String blockName);

    @Query(value = """
    SELECT
        EXTRACT(DOW FROM r.timestamp) AS day_of_week,
        EXTRACT(HOUR FROM r.timestamp) AS hour,
        AVG(r.kw) AS average_kw
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN societies s ON d.society_id = s.id
    WHERE s.builder_id = :builderId
      AND r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '28 days'
    GROUP BY EXTRACT(DOW FROM r.timestamp), EXTRACT(HOUR FROM r.timestamp)
    ORDER BY day_of_week, hour
    """, nativeQuery = true)
    List<Object[]> getBuilderHeatmap(@Param("builderId") Long builderId);

    @Query(value = """
    SELECT 
        r.id AS reading_id,
        f.flat_number,
        s.name AS block_name,
        r.kw AS current_kw,
        COALESCE(fb.avg_kw, 1.5) AS expected_kw,
        r.timestamp
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN societies s ON d.society_id = s.id
    LEFT JOIN flats f ON d.mapped_flat_id = f.id
    LEFT JOIN (
        SELECT d2.mapped_flat_id AS flat_id, AVG(r2.kw) AS avg_kw
        FROM readings r2
        JOIN devices d2 ON r2.device_id = d2.id
        JOIN societies s2 ON d2.society_id = s2.id
        WHERE s2.builder_id = :builderId
          AND r2.timestamp >= CURRENT_TIMESTAMP - INTERVAL '28 days'
        GROUP BY d2.mapped_flat_id
    ) fb ON fb.flat_id = f.id
    WHERE s.builder_id = :builderId
      AND r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      AND r.kw >= 2.0
      AND r.kw >= (2.5 * COALESCE(fb.avg_kw, 1.5))
    ORDER BY r.timestamp DESC
    LIMIT 30
    """, nativeQuery = true)
    List<Object[]> findAnomaliesByBuilder(@Param("builderId") Long builderId);

    @Query(value = """
    SELECT COALESCE(SUM(r.kw), 0.0)
    FROM readings r
    WHERE r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    """, nativeQuery = true)
    Double getPlatformLiveKw();

    @Query(value = """
    SELECT COALESCE(SUM(r.kwh), 0.0)
    FROM readings r
    WHERE r.timestamp >= :startDate AND r.timestamp <= :endDate
    """, nativeQuery = true)
    Double getPlatformMonthKwh(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query(value = """
    SELECT COALESCE(SUM(r.kw), 0.0)
    FROM readings r
    JOIN devices d ON r.device_id = d.id
    JOIN societies s ON d.society_id = s.id
    WHERE s.builder_id = :builderId
      AND r.timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    """, nativeQuery = true)
    Double getLiveKwByBuilderId(@Param("builderId") Long builderId);

    @Modifying
    @Query(value = """
    DELETE FROM readings
    WHERE device_id IN (SELECT id FROM devices WHERE society_id = :societyId)
    """, nativeQuery = true)
    void deleteBySocietyId(@Param("societyId") Long societyId);
}
