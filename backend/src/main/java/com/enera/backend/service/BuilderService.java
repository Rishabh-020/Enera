package com.enera.backend.service;

import com.enera.backend.dto.builder.BuilderOverviewResponse;
import com.enera.backend.dto.builder.BuilderSocietyResponse;
import com.enera.backend.dto.builder.CreateBuilderRequest;
import com.enera.backend.dto.society.HourlyBreakDownResponse;
import com.enera.backend.entity.Builder;
import com.enera.backend.entity.Role;
import com.enera.backend.entity.Society;
import com.enera.backend.entity.User;
import com.enera.backend.exception.BuilderNotFoundException;
import com.enera.backend.exception.SocietyNotFoundException;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.*;
import org.hibernate.property.access.spi.BuiltInPropertyAccessStrategies;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private static final double BASE_KW_PERCENTAGE = 0.30;
    private static final double SOCIETY_KW_PERCENTAGE = 0.50;
    private static final double PEEK_KW_PERCENTAGE = 0.20;
    private static final double ROUND_FACTOR = 0.10;
    private static final int COST_PER_UNIT = 8;

    BuilderService(BuilderRepository builderRepository,
                   SocietyRepository societyRepository,
                   BlockRepository blockRepository,
                   ReadingRepository readingRepository,
                   DeviceRepository deviceRepository,
                   FlatRepository flatRepository,
                   UserRepository userRepository,
                   PasswordEncoder passwordEncoder){
        this.builderRepository = builderRepository;
        this.societyRepository = societyRepository;
        this.blockRepository = blockRepository;
        this.readingRepository = readingRepository;
        this.deviceRepository = deviceRepository;
        this.flatRepository = flatRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
        response.setMtdCost(mtdKwh * COST_PER_UNIT);

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
            Double roundedMom = Math.round(mom * ROUND_FACTOR) / ROUND_FACTOR;

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

            double baseKwh = Math.round(totalFlatKwh * BASE_KW_PERCENTAGE * ROUND_FACTOR) / ROUND_FACTOR;
            double societyKwh = Math.round(totalFlatKwh * SOCIETY_KW_PERCENTAGE * ROUND_FACTOR) / ROUND_FACTOR;
            double peekKwh = Math.round(totalFlatKwh * PEEK_KW_PERCENTAGE * ROUND_FACTOR) / ROUND_FACTOR;
            double commonAreaKwh = Math.round(commonKwh * ROUND_FACTOR) / ROUND_FACTOR;

            response.add(new HourlyBreakDownResponse(hour, baseKwh, societyKwh, commonAreaKwh, peekKwh));
        }

        return response;
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
}
