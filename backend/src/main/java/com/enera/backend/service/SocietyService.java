package com.enera.backend.service;

import com.enera.backend.config.DemoUserInitializer;
import com.enera.backend.dto.commonArea.CommonAreaResponse;
import com.enera.backend.dto.commonArea.CreateCommonAreaRequest;
import com.enera.backend.dto.device.RegisterDeviceRequest;
import com.enera.backend.dto.device.RegisterDeviceResponse;
import com.enera.backend.dto.society.*;
import com.enera.backend.dto.user.CreateUserRequest;
import com.enera.backend.entity.*;
import com.enera.backend.exception.*;
import com.enera.backend.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.enera.backend.util.DateTimeUtils;
import com.enera.backend.util.EnergyCalculationUtils;
import com.enera.backend.util.EnergyConstants;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;

@Service
public class SocietyService {
    private final SocietyRepository societyRepository;
    private final ReadingRepository readingRepository;
    private final FlatRepository flatRepository;
    private final DeviceRepository deviceRepository;
    private final BlockRepository blockRepository;
    private final CommonAreaRepository commonAreaRepository;
    private final UserRepository userRepository;
    private final BuilderRepository builderRepository;
    private final PasswordEncoder passwordEncoder;
    private final BlockService blockService;
    private final DemoUserInitializer demoUserInitializer;

    SocietyService(SocietyRepository societyRepository,
                   ReadingRepository readingRepository,
                   FlatRepository flatRepository,
                   DeviceRepository deviceRepository,
                   BlockRepository blockRepository,
                   CommonAreaRepository commonAreaRepository,
                   UserRepository userRepository,
                   BuilderRepository builderRepository,
                   PasswordEncoder passwordEncoder,
                   BlockService blockService,
                   DemoUserInitializer demoUserInitializer) {
        this.societyRepository = societyRepository;
        this.readingRepository = readingRepository;
        this.flatRepository = flatRepository;
        this.deviceRepository = deviceRepository;
        this.blockRepository = blockRepository;
        this.commonAreaRepository = commonAreaRepository;
        this.userRepository = userRepository;
        this.builderRepository = builderRepository;
        this.passwordEncoder = passwordEncoder;
        this.blockService = blockService;
        this.demoUserInitializer = demoUserInitializer;
    }

    public SocietyOverviewResponse getSocietyOverview(Long societyId) {
        Society society = societyRepository.findById(societyId).
                orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        Double liveKw = readingRepository.getLiveKwBySocietyId(societyId);

        Integer totalFlats = flatRepository.countByFloorBlockSocietyId(societyId);

        Integer occupiedFlats = flatRepository.countByFloorBlockSocietyIdAndStatus(societyId, true);

        Integer devicesOnline = deviceRepository.countBySocietyIdAndStatus(societyId, true);
        Integer devicesOffline = deviceRepository.countBySocietyIdAndStatus(societyId, false);
        Integer totalDevices = (devicesOnline != null ? devicesOnline : 0) + (devicesOffline != null ? devicesOffline : 0);

        LocalDateTime st = DateTimeUtils.getStartOfCurrentMonth();
        LocalDateTime ed = LocalDateTime.now();
        Double mtdKwh = readingRepository.getMonthKwhBySociety(societyId, st, ed);

        Double mtdCost = mtdKwh * EnergyConstants.COST_PER_KWH;

        SocietyOverviewResponse response = new SocietyOverviewResponse();

        response.setName(society.getName());
        response.setLiveKw(liveKw);
        response.setTotalFlats(totalFlats);
        response.setOccupiedFlats(occupiedFlats);
        response.setDevicesOnline(devicesOnline);
        response.setDevicesOffline(devicesOffline);
        response.setTotalDevices(totalDevices);
        response.setMtdKwh(mtdKwh);
        response.setMtdCost(mtdCost);

        return response;
    }

    public List<SocietyBlockResponse> getSocietyBlocks(Long societyId) {
        List<SocietyBlockResponse> responses = new ArrayList<>();

        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        List<Block> blocks = blockRepository.findBySocietyId(societyId);

        // Calculate kWh for each block in a single pass, avoid double-querying
        Map<Long, Double> blockKwhMap = new HashMap<>();
        double totalKwh = 0;

        for (Block block : blocks) {
            Double kwh = readingRepository.getMonthKwhBySocietyBlockId(block.getId());
            blockKwhMap.put(block.getId(), kwh);
            totalKwh += kwh;
        }

        double averageKwh = blocks.isEmpty() ? 0 : totalKwh / blocks.size();

        for (Block block : blocks) {
            SocietyBlockResponse response = new SocietyBlockResponse();

            Long id = block.getId();
            Double mtdKwh = blockKwhMap.get(id);
            Double liveKw = readingRepository.getLiveKwBySocietyBlockId(id);
            Long flatCount = flatRepository.countByFloorBlockId(id);
            Boolean aboveAvg = mtdKwh > averageKwh * 1.05;

            response.setId(id);
            response.setName(block.getBlockName());
            response.setBlockName(block.getBlockName());
            response.setMtdKwh(mtdKwh);
            response.setLiveKw(liveKw);
            response.setFlatCount(flatCount);
            response.setAboveAverage(aboveAvg);
            // todayKwh is not yet implemented — set to 0 for now
            response.setTodayKwh(0.0);

            responses.add(response);
        }

        return responses;
    }

    public List<SocietyCommonAreaResponse> getSocietyCommonAreas(Long societyId) {
        List<SocietyCommonAreaResponse> responses = new ArrayList<>();

        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        List<CommonArea> commonAreas = commonAreaRepository.findBySocietyId(societyId);

        for (CommonArea commonArea : commonAreas) {
            SocietyCommonAreaResponse response = new SocietyCommonAreaResponse();

            Long id = commonArea.getId();
            Double currentKw = readingRepository.getCurrentKwByCommonAreaId(id);

            response.setId(id);
            response.setName(commonArea.getName());
            response.setCategory(commonArea.getCategory());
            response.setFloorOrLocation(commonArea.getFloorOrLocation());
            response.setType(commonArea.getCategory());
            response.setCurrentKw(currentKw);

            responses.add(response);
        }

        return responses;
    }

    public double[][] getSocietyHeatmap(Long societyId, String filter) {

        if (!societyRepository.existsById(societyId)) {
            throw new SocietyNotFoundException("Society not found");
        }
        List<Object[]> data;

        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("Whole society")
                || filter.equalsIgnoreCase("All")) {
            data = readingRepository.getSocietyHeatmap(societyId);
        } else if (filter.trim().toLowerCase().startsWith("common")) {
            data = readingRepository.getSocietyHeatmapCommonAreas(societyId);
        } else {
            data = readingRepository.getSocietyHeatmapByBlock(societyId, filter.trim());
        }
        return EnergyCalculationUtils.buildHeatmapMatrix(data);
    }

    public List<SocietyFlatResponse> getSocietyFlatResponse (Long societyId){
        List<SocietyFlatResponse> responses = new ArrayList<>();

        Society society = societyRepository.findById(societyId).
                orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        List<Flat> flats = flatRepository.findByFloorBlockSocietyId(societyId);

        for (Flat flat : flats) {
            SocietyFlatResponse response = new SocietyFlatResponse();

            response.setId(flat.getId());
            response.setFlatNumber(flat.getFlatNumber());
            response.setBhkType(flat.getBhkType());
            response.setOccupied(flat.isStatus());

            User resident = userRepository.findFirstByFlatAndRoleOrderByIdDesc(flat, Role.RESIDENT)
                    .orElse(null);
            response.setResidentId(resident != null ? resident.getId() : null);
            response.setResidentName(resident != null ? resident.getName() : null);
            response.setResidentEmail(resident != null ? resident.getEmail() : null);

            response.setBlockName(flat.getFloor().getBlock().getBlockName());
            response.setFloorNumber(flat.getFloor().getFloorNumber());

            Double mtdKwh = readingRepository.getMonthKwhByFlatId(flat.getId());
            response.setMtdKwh(mtdKwh);

            Boolean deviceOnline = deviceRepository.getStatusByFlatId(flat.getId());
            response.setMeterStatus(Boolean.TRUE.equals(deviceOnline) ? "live" : "offline");

            responses.add(response);
        }

        return responses;
    }

    public List<SocietyDeviceResponse> getSocietyDevice (Long societyId){
        Society society = societyRepository.findById(societyId).
                orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        List<Device> devices = deviceRepository.findBySocietyId(societyId);

        List<SocietyDeviceResponse> responses = new ArrayList<>();

        for (Device device : devices) {
            SocietyDeviceResponse response = new SocietyDeviceResponse();

            response.setId(device.getId());
            response.setDeviceSerial(device.getDeviceSerial());
            response.setDeviceType(device.getDeviceType());

            String blockName = null;
            if (device.getFlat() != null) {
                if (device.getFlat().getFloor() != null && device.getFlat().getFloor().getBlock() != null) {
                    blockName = device.getFlat().getFloor().getBlock().getBlockName();
                }
                String blockPrefix = blockName != null ? "Block " + blockName + " · " : "";
                response.setBlockName(blockName != null ? "Block " + blockName : "—");
                response.setMappedTo(blockPrefix + "Flat " + device.getFlat().getFlatNumber());
            } else if (device.getCommonArea() != null) {
                response.setBlockName("Common Area");
                response.setMappedTo(device.getCommonArea().getName() != null ? device.getCommonArea().getName() : device.getCommonArea().getCategory());
            } else {
                response.setBlockName("—");
                response.setMappedTo("Unassigned");
            }

            response.setMeterStatus(device.isStatus());
            response.setLastSeenAt(device.getLastSeenAt());

            responses.add(response);
        }

        return responses;
    }

    public RegisterDeviceResponse registerDevice (Long societyId, RegisterDeviceRequest request){
        Society society = societyRepository.findById(societyId).
                orElseThrow(() -> new SocietyNotFoundException("Society does not exist"));

        Long deviceSerial = request.getDeviceSerial();

        Device existingDevice = deviceRepository.findByDeviceSerial(deviceSerial)
                .orElse(null);

        if (existingDevice != null) {
            throw new DuplicateDeviceException("Device already registered");
        }

        Device device = new Device();

        String deviceType = request.getDeviceType();
        Long flatId = request.getFlatId();
        Long commonAreaId = request.getCommonAreaId();

        device.setDeviceSerial(deviceSerial);
        device.setDeviceType(deviceType);
        device.setSociety(society);
        device.setStatus(true);

        LocalDateTime time = LocalDateTime.now();
        device.setLastSeenAt(time);

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(flatId).orElseThrow(
                    () -> new FlatNotFoundException("Flat not found")
            );

            device.setFlat(flat);
        } else if (request.getCommonAreaId() != null) {
            CommonArea commonArea = commonAreaRepository.findById(commonAreaId).orElseThrow(
                    () -> new FlatNotFoundException("Common Area not found")
            );

            device.setCommonArea(commonArea);
        } else {
            throw new BadRequestException("Please select a flat or common area to map the device.");
        }

        Device savedDevice = deviceRepository.save(device);

        RegisterDeviceResponse response = new RegisterDeviceResponse();

        String mappedTo = savedDevice.getFlat() != null ? "Flat" : "Common Area";

        response.setSocietyId(savedDevice.getSociety().getId());
        response.setDeviceSerial(savedDevice.getDeviceSerial());
        response.setDeviceType(savedDevice.getDeviceType());
        response.setMappedTo(mappedTo);

        return response;
    }

    public List<DailyTrendResponse> getDailyTrend (Long societyId,int days, String filter){
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        if (readingRepository.count() < 1000) {
            demoUserInitializer.ensureDemoSeeded();
        }

        List<Object[]> rows;
        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("Whole society")) {
            rows = readingRepository.getDailyTrendBySociety(societyId, days);
        } else if (filter.equalsIgnoreCase("Common areas")) {
            rows = readingRepository.getDailyTrendBySocietyCommonAreas(societyId, days);
        } else {
            rows = readingRepository.getDailyTrendBySocietyBlock(societyId, days, filter.trim());
        }

        Map<String, double[]> dbValuesByDay = new HashMap<>();
        for (Object[] row : rows) {
            String dateStr = (String) row[0];
            double totalKwh = ((Number) row[1]).doubleValue();
            double commonAreaKwh = ((Number) row[2]).doubleValue();
            if (dateStr != null) {
                dbValuesByDay.put(dateStr.trim().toLowerCase(), new double[]{totalKwh, commonAreaKwh});
            }
        }

        List<DailyTrendResponse> responses = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd MMM", Locale.ENGLISH);

        for (LocalDate d = startOfMonth; !d.isAfter(today); d = d.plusDays(1)) {
            String formatted = d.format(dtf);
            double totalKwh = 0.0;
            double commonAreaKwh = 0.0;

            String key = formatted.toLowerCase();
            if (dbValuesByDay.containsKey(key)) {
                double[] val = dbValuesByDay.get(key);
                totalKwh = val[0];
                commonAreaKwh = val[1];
            }

            responses.add(DailyTrendResponse.builder()
                    .date(formatted)
                    .totalKwh(Math.round(totalKwh * 10.0) / 10.0)
                    .commonAreaKwh(Math.round(commonAreaKwh * 10.0) / 10.0)
                    .build());
        }

        return responses;
    }

    public List<HourlyBreakDownResponse> getHourlyBreakDown (Long societyId, LocalDate date, String filter){
        Society society = societyRepository.findById(societyId).
                orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        if (date == null) {
            date = LocalDate.now();
        }

        List<HourlyBreakDownResponse> response = new ArrayList<>();

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        List<Object[]> rows;

        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("Whole society")) {
            rows = readingRepository.getHourlyBreakdownByDate(societyId, start, end);
        } else if (filter.equalsIgnoreCase("Common areas")) {
            rows = readingRepository.getHourlyBreakdownByCommonAreas(societyId, start, end);
        } else {
            rows = readingRepository.getHourlyBreakdownByBlock(societyId, filter.trim(), start, end);
        }

        return EnergyCalculationUtils.calculateHourlyBreakdown(rows);
    }

    public List<SocietyAnomaliesResponse> getAnomalies (Long societyId, String filter){
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        List<Object[]> readings;

        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("Whole society")) {
            readings = readingRepository.findAnomaliesBySociety(societyId);
        } else if (filter.equalsIgnoreCase("Common areas")) {
            readings = new ArrayList<>();
        } else {
            readings = readingRepository.findAnomaliesByBlock(societyId, filter.trim());
        }
        List<SocietyAnomaliesResponse> responses = new ArrayList<>();

        for (Object[] reading : readings) {
            Long id = ((Number) reading[0]).longValue();
            String flatNumber = (String) reading[1];
            String blockName = (String) reading[2];
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
            response.setFlat("Flat " + flatNumber);
            response.setFlatId("Flat " + flatNumber);
            response.setFlatNumber(flatNumber);
            response.setBlockName(blockName);
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
    public SocietyResponse createSociety (CreateSocietyRequest request){
        Builder builder = builderRepository.findById(request.getBuilderId())
                .orElseThrow(() -> new RuntimeException("Builder not found with id: " + request.getBuilderId()));

        Society society = new Society();

        society.setName(request.getName());
        society.setBuilder(builder);
        society.setAddress(request.getAddress());
        society.setCity(request.getCity());
        society.setTotalBlocks(request.getTotalBlocks());

        Society savedSociety = societyRepository.save(society);

        String adminEmail = request.getAdminEmail();
        if (adminEmail != null && !adminEmail.isBlank()) {
            if (userRepository.findByEmail(adminEmail).isPresent()) {
                throw new DuplicateEmailException("User with email " + adminEmail + " already exists");
            }

            User admin = new User();
            admin.setRole(Role.SOCIETY_ADMIN);
            admin.setName(request.getAdminName() != null && !request.getAdminName().isBlank()
                    ? request.getAdminName()
                    : request.getName() + " Admin");
            admin.setEmail(adminEmail);
            String rawPassword = request.getAdminPassword() != null && !request.getAdminPassword().isBlank()
                    ? request.getAdminPassword()
                    : EnergyConstants.DEFAULT_ADMIN_PASSWORD;
            admin.setPasswordHash(passwordEncoder.encode(rawPassword));
            admin.setSociety(savedSociety);

            userRepository.save(admin);
        }

        SocietyResponse response = new SocietyResponse();
        response.setId(savedSociety.getId());
        response.setName(savedSociety.getName());
        response.setBuilderId(builder.getId());
        response.setAddress(savedSociety.getAddress());
        response.setCity(savedSociety.getCity());
        response.setTotalBlocks(savedSociety.getTotalBlocks());
        response.setCreatedAt(savedSociety.getCreatedAt());

        return response;
    }

    @Transactional
    public void deleteSociety (Long societyId){
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        readingRepository.deleteBySocietyId(societyId);

        deviceRepository.deleteBySocietyId(societyId);

        List<User> users = userRepository.findBySociety(society);
        for (User user : users) {
            user.setFlat(null);
            user.setSociety(null);
            userRepository.save(user);
        }

        List<CommonArea> commonAreas = commonAreaRepository.findBySocietyId(societyId);
        commonAreaRepository.deleteAll(commonAreas);

        List<Block> blocks = blockRepository.findBySocietyId(societyId);
        for (Block block : blocks) {
            blockService.deleteBlock(block.getId());
        }

        for (User user : users) {
            if (user.getRole() == Role.RESIDENT || user.getRole() == Role.SOCIETY_ADMIN) {
                userRepository.delete(user);
            }
        }

        societyRepository.delete(society);
    }

    @Transactional
    public RegisterResidentResponse registerResident (CreateUserRequest request){
        Society society = societyRepository.findById(request.getSocietyId())
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        Flat flat = flatRepository.findById(request.getFlatId())
                .orElseThrow(() -> new FlatNotFoundException("Flat not found"));

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException("User with email " + request.getEmail() + " already exists");
        }

        Optional<User> existingResident = userRepository.findFirstByFlatAndRoleOrderByIdDesc(flat, Role.RESIDENT);
        if (existingResident.isPresent()) {
            throw new FlatAlreadyOccupiedException("Flat " + flat.getFlatNumber() + " is already occupied by " + existingResident.get().getName() + ". Please remove the existing resident before assigning a new one.");
        }

        flat.setStatus(true);
        flatRepository.save(flat);

        User resident = new User();
        resident.setName(request.getName());
        resident.setEmail(request.getEmail());
        resident.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        resident.setRole(Role.RESIDENT);
        resident.setSociety(society);
        resident.setFlat(flat);

        User saved = userRepository.save(resident);

        String blockName = request.getBlockName();
        if ((blockName == null || blockName.isBlank()) && flat.getFloor() != null && flat.getFloor().getBlock() != null) {
            blockName = flat.getFloor().getBlock().getBlockName();
        }

        return RegisterResidentResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole().name())
                .flatId(flat.getId())
                .societyId(society.getId())
                .blockName(blockName)
                .build();
    }

    @Transactional
    public void deleteResident (Long societyId, Long residentOrFlatId){
        // Try finding by user ID first
        Optional<User> userOpt = userRepository.findById(residentOrFlatId);

        // If not found by user ID, check if flat ID was passed
        if (userOpt.isEmpty()) {
            Flat flat = flatRepository.findById(residentOrFlatId).orElse(null);
            if (flat != null) {
                userOpt = userRepository.findFirstByFlatAndRoleOrderByIdDesc(flat, Role.RESIDENT);
            }
        }

        User user = userOpt.orElseThrow(() -> new UserNotFoundException("Resident not found"));

        if (user.getSociety() == null || !user.getSociety().getId().equals(societyId)) {
            throw new RuntimeException("Resident does not belong to current society");
        }

        Flat flat = user.getFlat();
        if (flat != null) {
            flat.setStatus(false);
            flatRepository.save(flat);
        }

        // Permanently delete the user from the database
        userRepository.delete(user);
    }

    @Transactional
    public CommonAreaResponse createCommonArea (Long societyId, CreateCommonAreaRequest request){
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        CommonArea commonArea = new CommonArea();
        commonArea.setSociety(society);
        commonArea.setName(request.getName());
        commonArea.setCategory(request.getCategory());
        commonArea.setFloorOrLocation(request.getFloorOrLocation());

        CommonArea saveCommonArea = commonAreaRepository.save(commonArea);

        CommonAreaResponse response = new CommonAreaResponse();
        response.setSocietyId(saveCommonArea.getSociety().getId());
        response.setName(saveCommonArea.getName());
        response.setSocietyName(saveCommonArea.getSociety().getName());
        response.setCategory(saveCommonArea.getCategory());
        response.setId(saveCommonArea.getId());
        response.setFloorOrLocation(saveCommonArea.getFloorOrLocation());

        return response;
    }

    @Transactional
    public void deleteCommonArea (Long societyId, Long commonAreaId){
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new SocietyNotFoundException("Society not found"));

        CommonArea commonArea = commonAreaRepository.findById(commonAreaId)
                .orElseThrow(() -> new RuntimeException("Common area not found"));

        if (commonArea.getSociety() == null || !commonArea.getSociety().getId().equals(societyId)) {
            throw new RuntimeException("Common area does not belong to this society");
        }

        List<Device> devices = deviceRepository.findByCommonArea(commonArea);
        for (Device device : devices) {
            device.setStatus(false);
            device.setCommonArea(null);
            deviceRepository.save(device);
        }

        commonAreaRepository.delete(commonArea);
    }
}
