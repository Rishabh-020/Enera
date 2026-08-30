package com.enera.backend.service;

import com.enera.backend.dto.FlatOwner.*;
import com.enera.backend.dto.floor.FloorResponse;
import com.enera.backend.entity.*;
import com.enera.backend.exception.*;
import com.enera.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

import com.enera.backend.util.EnergyConstants;

@Service
public class FlatService {
    private final FlatRepository flatRepository;
    private final ReadingRepository readingRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final FloorRepository floorRepository;
    private static final double LOW_KW_THRESHOLD = 2.0;
    private static final double MID_KW_THRESHOLD = 4.0;
    private static final double NEG_KW = 0.0;

    FlatService(FlatRepository flatRepository,
                ReadingRepository readingRepository,
                DeviceRepository deviceRepository,
                FloorRepository floorRepository,
                UserRepository userRepository){
        this.flatRepository = flatRepository;
        this.readingRepository = readingRepository;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.floorRepository = floorRepository;
    }
    public FlatLiveResponse getFlatLive(Long flatId) {
        Flat flat = flatRepository.findById(flatId)
                .orElseThrow(() -> new FlatNotFoundException("Flat not found"));

        Optional<Reading> readingOpt = readingRepository.findLatestReadingByFlatId(flatId);
        Optional<Device> deviceOpt = deviceRepository.findByFlatId(flatId);

        FlatLiveResponse response = new FlatLiveResponse();

        if (readingOpt.isEmpty()) {
            response.setLevel("normal");
            response.setStatus(deviceOpt.map(Device::isStatus).orElse(false));
            response.setTimeStamp(LocalDateTime.now());
            response.setPctVsUsual(0.0);
            response.setLastReadingAt(LocalDateTime.now());
            response.setKw(0.0);
            return response;
        }

        Reading reading = readingOpt.get();
        double kw = reading.getKw() != null ? reading.getKw() : 0.0;

        if (kw < LOW_KW_THRESHOLD) {
            response.setLevel("normal");
        } else if (kw < MID_KW_THRESHOLD) {
            response.setLevel("amber");
        } else {
            response.setLevel("high");
        }

        Double usualKw = readingRepository.findAverageKwByFlatId(flatId);
        if (usualKw == null || usualKw <= NEG_KW) {
            usualKw = kw > 0 ? kw : 1.5;
        }

        double pctVsUsual = usualKw > 0 ? ((kw - usualKw) / usualKw) * 100.0 : 0.0;
        double roundedPct = Math.round(pctVsUsual * 10.0) / 10.0;

        response.setStatus(deviceOpt.map(Device::isStatus).orElse(true));
        response.setTimeStamp(reading.getTimestamp());
        response.setPctVsUsual(roundedPct);
        response.setLastReadingAt(reading.getTimestamp());
        response.setKw(kw);

        return response;
    }

    public FlatSummaryResponse getFlatSummary(Long flatId,String month){
        Flat flat = flatRepository.findById(flatId).orElseThrow(
                ()-> new FlatNotFoundException("Flat not found")
        );

        FlatSummaryResponse response = new FlatSummaryResponse();

        YearMonth yearMonth = YearMonth.parse(month);

        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        List<Reading> readings = readingRepository.findReadingsForFlatAndPeriod(
                        flatId,
                        start,
                        end
                );

        Map<DayOfWeek,Double> dailyCons = new HashMap<>();
        Double totalKwh  = 0.0;
        List<DailySeriesResponse> seriesResponses = new ArrayList<>();

        for(Reading reading : readings){
            Double kwh = reading.getKwh();
            totalKwh  += kwh;

            DayOfWeek day =
                    reading.getTimestamp().getDayOfWeek();

            dailyCons.merge(
                    day,
                    reading.getKwh(),
                    Double::sum
            );

            seriesResponses.add(new DailySeriesResponse(day,kwh));
        }

        DayOfWeek peakDay = dailyCons
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        LocalDate today = LocalDate.now();

        int daysPassed;

        if (yearMonth.equals(YearMonth.from(today))) {
            daysPassed = today.getDayOfMonth();
        } else {
            daysPassed = yearMonth.lengthOfMonth();
        }

        double projectedTotal =
                (totalKwh / daysPassed)
                        * yearMonth.lengthOfMonth();

        response.setPeakDay(peakDay);
        response.setTotalKwh(totalKwh);
        response.setEstCost(totalKwh * EnergyConstants.COST_PER_KWH);
        response.setProjectedCost(projectedTotal * EnergyConstants.COST_PER_KWH);
        response.setProjectedTotal(projectedTotal);
        response.setSeries(seriesResponses);

        return response;
    }

    public FlatTrendResponse getFlatTrend(Long flatId){
        Flat flat = flatRepository.findById(flatId).orElseThrow(
                ()-> new FlatNotFoundException("Flat not found")
        );

        LocalDate today = LocalDate.now();

        LocalDateTime start = today.minusDays(6).atStartOfDay();

        LocalDateTime end = today.plusDays(1).atStartOfDay();

        List<Reading> readings = readingRepository.findReadingsForPeriod(
                flatId,
                start,
                end
        );

        Map<LocalDate, Double> dailyConsumption = new HashMap<>();

        for (Reading reading : readings) {
            LocalDate date = reading.getTimestamp().toLocalDate();

            dailyConsumption.merge(
                    date,
                    reading.getKwh(),
                    Double::sum
            );
        }

        List<Map.Entry<LocalDate, Double>> dailyData = new ArrayList<>(dailyConsumption.entrySet());

        List<TrendPointResponse> points = new ArrayList<>();

        double windowSum = 0;
        int windowSize = 3;

        for (int i = 0; i < dailyData.size(); i++) {

            Double kwh = dailyData.get(i).getValue();

            windowSum += kwh;

            if (i >= windowSize) {
                windowSum -= dailyData.get(i - windowSize).getValue();
            }

            int count = Math.min(i + 1, windowSize);

            double rollingAvg = windowSum / count;

            points.add(
                    new TrendPointResponse(
                            dailyData.get(i).getKey(),
                            kwh,
                            rollingAvg
                    )
            );
        }

        double currentWeekTotal = 0;

        for (Double kwh : dailyConsumption.values()) {
            currentWeekTotal += kwh;
        }

        LocalDateTime previousStart = today.minusDays(13).atStartOfDay();

        LocalDateTime previousEnd = today.minusDays(6).atStartOfDay();

        List<Reading> previousReadings =readingRepository.findReadingsForPeriod(
                flatId,
                previousStart,
                previousEnd
        );

        Double previousWeekTotal = 0.0;

        for (Reading reading : previousReadings) {
            previousWeekTotal += reading.getKwh();
        }

        double pctChange = 0.0;

        if (previousWeekTotal != 0) {
            pctChange = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
        }

        FlatTrendResponse response = new FlatTrendResponse();

        response.setPctChange(pctChange);
        response.setPoints(points);

        return  response;
    }

    public FlatHourlyProfileResponse getFlatHourlyProfile(Long flatId){
        Flat flat = flatRepository.findById(flatId).orElseThrow(
                ()-> new FlatNotFoundException("Flat not found")
        );

        LocalDateTime st = LocalDate.now().atStartOfDay();

        LocalDateTime ed = LocalDate.now().plusDays(1).atStartOfDay();

        List<Reading> readings = readingRepository.findReadingsHourlyForPeriod(
                flatId,
                st,
                ed
        );

        Map<Integer, Double> hourlyConsumption = new TreeMap<>();

        for (Reading reading : readings) {

            int hour = reading.getTimestamp().getHour();

            hourlyConsumption.merge(
                    hour,
                    reading.getKwh(),
                    Double::sum
            );
        }

        List<HourlyPointResponse> hourlyPointResponses =
                new ArrayList<>();

        for (Map.Entry<Integer, Double> entry
                : hourlyConsumption.entrySet()) {

            hourlyPointResponses.add(
                    new HourlyPointResponse(
                            entry.getKey(),
                            entry.getValue()
                    )
            );
        }

        double maxKwh = 0;

        for (Double kwh : hourlyConsumption.values()) {
            maxKwh = Math.max(maxKwh, kwh);
        }

        List<Integer> peakHours = new ArrayList<>();

        for (Map.Entry<Integer, Double> entry
                : hourlyConsumption.entrySet()) {

            if (Double.compare(entry.getValue(), maxKwh) == 0) {
                peakHours.add(entry.getKey());
            }
        }


        FlatHourlyProfileResponse response = new FlatHourlyProfileResponse();

        response.setProfile(hourlyPointResponses);
        response.setPeakHours(peakHours);


        return response;
    }

    public FlatDetailResponse getFlatDetail(Long flatId){
        FlatDetailResponse response = new FlatDetailResponse();

        Flat flat = flatRepository.findById(flatId)
                .orElseThrow(() -> new FlatNotFoundException("Flat not found"));

        User user = userRepository.findFirstByFlatAndRoleOrderByIdDesc(flat, Role.RESIDENT)
                .orElse(null);

        String flatNumber = flat.getFlatNumber();

        String bhkType = flat.getBhkType();

        Long floorNumber = flat.getFloor().getFloorNumber();

        String blockName = flat.getFloor().getBlock().getBlockName();

        String residentName = user != null ? user.getName() : null;

        response.setResidentName(residentName);
        response.setFlatNumber(flatNumber);
        response.setBlockName(blockName);
        response.setBhkType(bhkType);
        response.setFloorNumber(floorNumber);

        return response;
    }

    @Transactional
    public FlatResponse createFlat(Long floorId,CreateFlatRequest request){
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(()-> new FloorNotFoundException("Floor not found"));

        if (request.getFlatNumber() == null || request.getFlatNumber().isBlank()) {
            throw new BadRequestException("Flat number cannot be empty");
        }

        if(flatRepository.existsByFloorAndFlatNumber(floor, request.getFlatNumber())){
            throw new RuntimeException("Flat already exists on that floor");
        }

        if (!request.getFlatNumber().trim().startsWith(String.valueOf(floor.getFloorNumber())) ||
        request.getFlatNumber().length() < 3) {
            throw new BadRequestException("Flat number must be according to the floor format (must start with " + floor.getFloorNumber() + " and have length 3)");
        }


        Flat flat = new Flat();
        flat.setFlatNumber(request.getFlatNumber());
        flat.setBhkType(request.getBhkType());
        flat.setFloor(floor);

        Flat saveFlat = flatRepository.save(flat);

        FlatResponse flatResponse = new FlatResponse();

        flatResponse.setFlatId(saveFlat.getId());
        flatResponse.setFloorId(floorId);

        if (floor.getBlock() != null){
            flatResponse.setBlockId(floor.getBlock().getId());
        }
        return flatResponse;
    }

    @Transactional
    public void deleteFlat(Long flatId){
        Flat flat = flatRepository.findById(flatId)
                .orElseThrow(()-> new FlatNotFoundException("Flat not found"));

        List<Device> devices = deviceRepository.findByFlat(flat);
        for(Device device : devices){
            device.setFlat(null);
            device.setStatus(false);
            deviceRepository.save(device);
        }

        List<User> residents = userRepository.findByFlat(flat);
        if (!residents.isEmpty()) {
            userRepository.deleteAll(residents);
        }

        flatRepository.delete(flat);
    }
}
