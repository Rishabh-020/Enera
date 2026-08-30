package com.enera.backend.service;

import com.enera.backend.dto.builder.BuilderOverviewResponse;
import com.enera.backend.dto.builder.BuilderSocietyResponse;
import com.enera.backend.dto.builder.CreateBuilderRequest;
import com.enera.backend.dto.society.HourlyBreakDownResponse;
import com.enera.backend.dto.society.SocietyAnomaliesResponse;
import com.enera.backend.entity.*;
import com.enera.backend.exception.BuilderNotFoundException;
import com.enera.backend.exception.SocietyNotFoundException;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.*;
import org.hibernate.property.access.spi.BuiltInPropertyAccessStrategies;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.enera.backend.util.DateTimeUtils;
import com.enera.backend.util.EnergyCalculationUtils;
import com.enera.backend.util.EnergyConstants;

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
    public final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SocietyService societyService;

    BuilderService(BuilderRepository builderRepository,
                   SocietyRepository societyRepository,
                   BlockRepository blockRepository,
                   ReadingRepository readingRepository,
                   DeviceRepository deviceRepository,
                   FlatRepository flatRepository,
                   UserRepository userRepository,
                   PasswordEncoder passwordEncoder,
                   SocietyService societyService){
        this.builderRepository = builderRepository;
        this.societyRepository = societyRepository;
        this.blockRepository = blockRepository;
        this.readingRepository = readingRepository;
        this.deviceRepository = deviceRepository;
        this.flatRepository = flatRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.societyService = societyService;
    }

    public BuilderOverviewResponse getBuilderOverview(Long builderId){
        Builder builder = builderRepository.findById(builderId).
                orElseThrow(()-> new BuilderNotFoundException("Builder not found"));

        Integer totalSocieties = societyRepository.countByBuilderId(builderId);

        Integer totalBlocks = blockRepository.countBySocietyBuilderId(builderId);

        Integer onlineDeviceCount = deviceRepository.countBySocietyBuilderIdAndStatus(builderId,true);

        LocalDateTime startDate = DateTimeUtils.getStartOfCurrentMonth();
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
        response.setMtdCost(mtdKwh * EnergyConstants.COST_PER_KWH);

        return response;
    }

    public List<BuilderSocietyResponse> getBuilderSocieties(Long builderId){
        Builder builder = builderRepository.findById(builderId)
                .orElseThrow(()-> new BuilderNotFoundException("Builder not found"));

        List<Society> societies = societyRepository.findByBuilderId(builderId);

        List<BuilderSocietyResponse> responses = new ArrayList<>();

        for(Society society : societies){
            BuilderSocietyResponse response = new BuilderSocietyResponse();

            LocalDateTime startDate = DateTimeUtils.getStartOfCurrentMonth();
            LocalDateTime endDate = LocalDateTime.now();

            Double mtdKwh = readingRepository.getMonthKwhBySociety(society.getId(),startDate,endDate);
            Integer totalFlat = flatRepository.countByFloorBlockSocietyId(society.getId());
            Integer occupiedFlat = flatRepository.countByFloorBlockSocietyIdAndStatus(society.getId(),true);
            Double averagePerFlat = totalFlat == 0 ? 0.0 : mtdKwh / totalFlat;
            LocalDate today = LocalDate.now();
            int dayOfMonth = Math.max(1, today.getDayOfMonth());
            int lengthOfMonth = today.lengthOfMonth();

            double safeMtdKwh = mtdKwh != null ? mtdKwh : 0.0;
            double projectedMtdKwh = (safeMtdKwh / dayOfMonth) * lengthOfMonth;

            LocalDateTime prevMonthStart = DateTimeUtils.getStartOfPreviousMonth();
            LocalDateTime prevMonthEnd = DateTimeUtils.getEndOfPreviousMonth();
            Double prevMonthKwh = readingRepository.getMonthKwhBySociety(society.getId(), prevMonthStart, prevMonthEnd);

            double minRealisticPrevMonth = occupiedFlat > 0 ? (double) occupiedFlat * 40.0 : 50.0;
            if (prevMonthKwh == null || prevMonthKwh < minRealisticPrevMonth) {
                prevMonthKwh = occupiedFlat > 0 ? (double) occupiedFlat * 120.0 : (projectedMtdKwh > 0 ? projectedMtdKwh : 100.0);
            }

            double mom = prevMonthKwh > 0 ? ((projectedMtdKwh - prevMonthKwh) / prevMonthKwh) * 100.0 : 0.0;
            Double roundedMom = Math.round(mom * EnergyConstants.ROUND_ONE_DECIMAL) / EnergyConstants.ROUND_ONE_DECIMAL;

            response.setName(society.getName());
            response.setId(society.getId());
            response.setMtdKwh(safeMtdKwh);
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

    public List<HourlyBreakDownResponse> getHourlyBreakDown(Long builderId, LocalDate date, String filter) {
        Builder builder = builderRepository.findById(builderId)
                .orElseThrow(() -> new BuilderNotFoundException("Builder not found"));

        if (date == null) {
            date = LocalDate.now();
        }

        List<HourlyBreakDownResponse> response = new ArrayList<>();

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        List<Object[]> rows;
        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("All societies") || filter.equalsIgnoreCase("All")) {
            rows = readingRepository.getHourlyBreakdownByBuilder(builderId, start, end);
        } else {
            Society targetSociety = societyRepository.findByBuilderId(builderId).stream()
                    .filter(s -> s.getName().equalsIgnoreCase(filter.trim()))
                    .findFirst()
                    .orElse(null);
            if (targetSociety != null) {
                rows = readingRepository.getHourlyBreakdownByDate(targetSociety.getId(), start, end);
            } else {
                rows = readingRepository.getHourlyBreakdownByBuilder(builderId, start, end);
            }
        }

        return EnergyCalculationUtils.calculateHourlyBreakdown(rows);
    }

    public double[][] getHeatMap(Long builderId, String filter) {
        if (!builderRepository.existsById(builderId)) {
            throw new BuilderNotFoundException("Builder not found");
        }

        List<Object[]> readings;
        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("All societies") || filter.equalsIgnoreCase("All")) {
            readings = readingRepository.getBuilderHeatmap(builderId);
        } else {
            Society targetSociety = societyRepository.findByBuilderId(builderId).stream()
                    .filter(s -> s.getName().equalsIgnoreCase(filter.trim()))
                    .findFirst()
                    .orElse(null);
            if (targetSociety != null) {
                readings = readingRepository.getSocietyHeatmap(targetSociety.getId());
            } else {
                readings = readingRepository.getBuilderHeatmap(builderId);
            }
        }

        return EnergyCalculationUtils.buildHeatmapMatrix(readings);
    }

    public List<SocietyAnomaliesResponse> getAnomalies(Long builderId, String filter) {
        if (!builderRepository.existsById(builderId)) {
            throw new BuilderNotFoundException("Builder not found");
        }

        List<Object[]> readings;
        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("All societies") || filter.equalsIgnoreCase("All")) {
            readings = readingRepository.findAnomaliesByBuilder(builderId);
        } else {
            Society targetSociety = societyRepository.findByBuilderId(builderId).stream()
                    .filter(s -> s.getName().equalsIgnoreCase(filter.trim()))
                    .findFirst()
                    .orElse(null);
            if (targetSociety != null) {
                readings = readingRepository.findAnomaliesBySociety(targetSociety.getId());
            } else {
                readings = readingRepository.findAnomaliesByBuilder(builderId);
            }
        }

        List<SocietyAnomaliesResponse> responses = new ArrayList<>();

        for (Object[] reading : readings) {
            Long id = ((Number) reading[0]).longValue();
            String flatNumber = (String) reading[1];
            String societyOrBlockName = (String) reading[2];
            double currentKw = ((Number) reading[3]).doubleValue();
            double expectedKw = Math.round(((Number) reading[4]).doubleValue() * 10.0) / 10.0;

            Object tsObj = reading[5];
            String detectedAtStr;
            if (tsObj instanceof java.sql.Timestamp) {
                detectedAtStr = ((java.sql.Timestamp) tsObj).toLocalDateTime().toString();
            } else if (tsObj instanceof LocalDateTime) {
                detectedAtStr = ((LocalDateTime) tsObj).toString();
            } else if (tsObj != null) {
                detectedAtStr = tsObj.toString();
            } else {
                detectedAtStr = LocalDateTime.now().toString();
            }

            double ratio = expectedKw > 0 ? Math.round((currentKw / expectedKw) * 10.0) / 10.0 : 2.5;

            SocietyAnomaliesResponse response = new SocietyAnomaliesResponse();
            response.setId(id);
            response.setFlat(flatNumber != null ? "Flat " + flatNumber : societyOrBlockName);
            response.setFlatId(flatNumber != null ? "Flat " + flatNumber : societyOrBlockName);
            response.setFlatNumber(flatNumber);
            response.setBlockName(societyOrBlockName);
            response.setCurrentKw(currentKw);
            response.setExpectedKw(expectedKw);
            response.setMultiplier(ratio + "x usual");
            response.setDesc("Drawing " + currentKw + " kW — expected " + expectedKw + " kW");
            response.setDescription("Drawing " + currentKw + " kW — expected " + expectedKw + " kW");
            response.setDetectedAt(detectedAtStr);
            response.setResolved(false);

            responses.add(response);
        }

        return responses;
    }

    @Transactional
    public Builder createBuilder(CreateBuilderRequest request) {
        Builder builder = new Builder();
        builder.setName(request.getName());
        builder.setEmail(request.getEmail());
        Builder saveBuilder = builderRepository.save(builder);

        User admin = new User();
        admin.setName(request.getName());
        admin.setEmail(request.getEmail());
        admin.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        admin.setBuilder(saveBuilder);
        admin.setRole(Role.BUILDER_ADMIN);
        userRepository.save(admin);

        return saveBuilder;
    }

    @Transactional
    public void deleteBuilder(Long builderId){
        Builder builder = builderRepository.findById(builderId)
                .orElseThrow(()-> new BuilderNotFoundException("Builder not found"));

        List<Society> societies = societyRepository.findByBuilderId(builderId);

        for(Society society : societies){
            societyService.deleteSociety(society.getId());
        }
        List<User> builderUsers = userRepository.findByBuilder(builder);
        for(User user : builderUsers){
            user.setBuilder(null);
            userRepository.save(user);
        }

        builderRepository.delete(builder);
    }
}
