package com.enera.backend.service;

import com.enera.backend.dto.builder.BuilderOverviewResponse;
import com.enera.backend.dto.builder.BuilderSocietyResponse;
import com.enera.backend.dto.society.HourlyBreakDownResponse;
import com.enera.backend.entity.Builder;
import com.enera.backend.entity.Society;
import com.enera.backend.exception.BuilderNotFoundException;
import com.enera.backend.exception.SocietyNotFoundException;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.*;
import org.hibernate.property.access.spi.BuiltInPropertyAccessStrategies;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BuilderService {
    private final BuilderRepository builderRepository;
    private final SocietyRepository societyRepository;
    private final BlockRepository blockRepository;
    private final ReadingRepository readingRepository;
    private final DeviceRepository deviceRepository;
    private final FlatRepository flatRepository;

    BuilderService(BuilderRepository builderRepository,
                   SocietyRepository societyRepository,
                   BlockRepository blockRepository,
                   ReadingRepository readingRepository,
                   DeviceRepository deviceRepository,
                   FlatRepository flatRepository){
        this.builderRepository = builderRepository;
        this.societyRepository = societyRepository;
        this.blockRepository = blockRepository;
        this.readingRepository = readingRepository;
        this.deviceRepository = deviceRepository;
        this.flatRepository = flatRepository;
    }

    public BuilderOverviewResponse getBuilderOverview(Long builderId){
        Builder builder = builderRepository.findById(builderId).
                orElseThrow(()-> new BuilderNotFoundException("Builder not found"));

        Integer totalSocieties = societyRepository.countByBuilderId(builderId);

        Integer totalBlocks = blockRepository.countBySocietyBuilderId(builderId);

        Integer onlineDeviceCount = deviceRepository.countBySocietyBuilderIdAndStatus(builderId,true);

        LocalDateTime startDate = LocalDate.now()
                .withDayOfMonth(1)
                .atStartOfDay();

        LocalDateTime endDate = LocalDateTime.now();

        Double mtdKwh = readingRepository.getMonthKwh(
                builderId,
                startDate,
                endDate
        );

        BuilderOverviewResponse response = new BuilderOverviewResponse();


        response.setName(builder.getName());
        response.setTotalSocieties(totalSocieties);
        response.setTotalBlocks(totalBlocks);
        response.setDevicesOnline(onlineDeviceCount);
        response.setMtdKwh(mtdKwh);
        response.setMtdCost(mtdKwh * 8);

        return response;
    }

    public List<BuilderSocietyResponse> getBuilderSocieties(Long builderId){
        Builder builder = builderRepository.findById(builderId)
                .orElseThrow(()-> new BuilderNotFoundException("Builder not found"));

        List<Society> societies = societyRepository.findByBuilderId(builderId);

        List<BuilderSocietyResponse> responses = new ArrayList<>();

        for(Society society : societies){
            BuilderSocietyResponse response = new BuilderSocietyResponse();

            LocalDateTime startDate = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            LocalDateTime endDate = LocalDateTime.now();

            Double mtdKwh = readingRepository.getMonthKwhBySociety(society.getId(),startDate,endDate);
            Integer totalFlat = flatRepository.countByFloorBlockSocietyId(society.getId());
            Integer occupiedFlat = flatRepository.countByFloorBlockSocietyIdAndStatus(society.getId(),true);
            Double averagePerFlat = totalFlat == 0 ? 0.0 : mtdKwh / totalFlat;

            LocalDateTime prevMonthStart = LocalDate.now().minusMonths(1).withDayOfMonth(1).atStartOfDay();
            LocalDateTime prevMonthEnd = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            Double prevMonthKwh = readingRepository.getMonthKwhBySociety(society.getId(), prevMonthStart, prevMonthEnd);
            if (prevMonthKwh == null || prevMonthKwh == 0.0) {
                prevMonthKwh = occupiedFlat > 0 ? (double) occupiedFlat * 120.0 : (mtdKwh > 0 ? mtdKwh * 0.95 : 100.0);
            }

            Double mom = prevMonthKwh > 0 ? ((mtdKwh - prevMonthKwh) / prevMonthKwh) * 100.0 : 0.0;
            Double roundedMom = Math.round(mom * 10.0) / 10.0;

            response.setName(society.getName());
            response.setId(society.getId());
            response.setMtdKwh(mtdKwh);
            response.setOccupiedFlats(occupiedFlat);
            response.setTotalFlats(totalFlat);
            response.setAvgPerFlat(averagePerFlat);
            response.setCity(society.getCity());
            response.setMom(roundedMom);
            response.setPrevMonthKwh(prevMonthKwh);

            responses.add(response);
        }

        return responses;
    }
    public List<HourlyBreakDownResponse> getHourlyBreakDown(Long builderId, LocalDate date){
        Builder builder = builderRepository.findById(builderId).
                orElseThrow(() -> new BuilderNotFoundException("Society not found"));

        if (date == null) {
            date = LocalDate.now();
        }


        List<HourlyBreakDownResponse> response = new ArrayList<>();

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        List<Object[]> rows = readingRepository.getHourlyBreakdownByBuilder(
                builderId,start,end
        );


        for (Object[] row : rows) {
            int hourNum = ((Number) row[0]).intValue();
            String hour = hourNum + ":00";

            double totalFlatKwh = ((Number) row[1]).doubleValue();
            double commonKwh = ((Number) row[2]).doubleValue();

            double baseKwh = Math.round(totalFlatKwh * 0.30 * 10.0) / 10.0;
            double societyKwh = Math.round(totalFlatKwh * 0.50 * 10.0) / 10.0;
            double peekKwh = Math.round(totalFlatKwh * 0.20 * 10.0) / 10.0;
            double commonAreaKwh = Math.round(commonKwh * 10.0) / 10.0;

            response.add(new HourlyBreakDownResponse(hour, baseKwh, societyKwh, commonAreaKwh, peekKwh));
        }

        return response;
    }
}
