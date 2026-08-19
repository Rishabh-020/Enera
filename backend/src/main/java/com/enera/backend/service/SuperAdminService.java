package com.enera.backend.service;

import com.enera.backend.dto.superAdmin.BuilderListResponse;
import com.enera.backend.dto.superAdmin.SuperAdminOverviewResponse;
import com.enera.backend.entity.Builder;
import com.enera.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class SuperAdminService {
    private final BuilderRepository builderRepository;
    private final SocietyRepository societyRepository;
    private final BlockRepository blockRepository;
    private final FlatRepository flatRepository;
    private final DeviceRepository deviceRepository;
    private final ReadingRepository readingRepository;
    private static final double ROUND_FACTOR = 10.0;

    public SuperAdminService(BuilderRepository builderRepository,
                             SocietyRepository societyRepository,
                             BlockRepository blockRepository,
                             FlatRepository flatRepository,
                             DeviceRepository deviceRepository,
                             ReadingRepository readingRepository) {
        this.builderRepository = builderRepository;
        this.societyRepository = societyRepository;
        this.blockRepository = blockRepository;
        this.flatRepository = flatRepository;
        this.deviceRepository = deviceRepository;
        this.readingRepository = readingRepository;
    }

    public SuperAdminOverviewResponse getOverview() {
        long totalBuilders = builderRepository.count();
        long totalSocieties = societyRepository.count();
        long totalBlocks = blockRepository.count();
        long totalFlats = flatRepository.count();
        long totalMeters = deviceRepository.count();

        LocalDateTime startDate = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endDate = LocalDateTime.now();

        Double totalMtdKwh = readingRepository.getPlatformMonthKwh(startDate, endDate);
        if (totalMtdKwh == null) totalMtdKwh = 0.0;

        Double liveGridKw = readingRepository.getPlatformLiveKw();
        if (liveGridKw == null || liveGridKw == 0.0) {
            // fallback to sum of societies if readings are older than 1h
            liveGridKw = 0.0;
        }

        return SuperAdminOverviewResponse.builder()
                .totalBuilders(totalBuilders)
                .totalSocieties(totalSocieties)
                .totalBlocks(totalBlocks)
                .totalFlats(totalFlats)
                .totalMeters(totalMeters)
                .liveGridKw(Math.round(liveGridKw * ROUND_FACTOR) / ROUND_FACTOR)
                .mtdKwh(Math.round(totalMtdKwh * ROUND_FACTOR) / ROUND_FACTOR)
                .build();
    }

    public List<BuilderListResponse> getBuilders() {
        List<Builder> builders = builderRepository.findAll();
        List<BuilderListResponse> responses = new ArrayList<>();

        LocalDateTime startDate = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endDate = LocalDateTime.now();

        for (Builder b : builders) {
            int societyCount = societyRepository.countByBuilderId(b.getId());
            Integer flatCount = flatRepository.countByFloorBlockSocietyBuilderId(b.getId());
            if (flatCount == null) flatCount = 0;

            Double mtdKwh = readingRepository.getMonthKwh(b.getId(), startDate, endDate);
            if (mtdKwh == null) mtdKwh = 0.0;

            Double liveKw = readingRepository.getLiveKwByBuilderId(b.getId());
            if (liveKw == null) liveKw = 0.0;

            responses.add(BuilderListResponse.builder()
                    .id(b.getId())
                    .name(b.getName())
                    .email(b.getEmail())
                    .totalSocieties(societyCount)
                    .totalFlats(flatCount)
                    .liveKw(Math.round(liveKw * ROUND_FACTOR) / ROUND_FACTOR)
                    .mtdKwh(Math.round(mtdKwh * ROUND_FACTOR) / ROUND_FACTOR)
                    .build());
        }

        return responses;
    }
}
