package com.enera.backend.service;

import com.enera.backend.dto.FlatOwner.*;
import com.enera.backend.entity.Device;
import com.enera.backend.entity.Flat;
import com.enera.backend.entity.Reading;
import com.enera.backend.entity.User;
import com.enera.backend.exception.DeviceNotFoundException;
import com.enera.backend.exception.FlatNotFoundException;
import com.enera.backend.exception.ReadingNotFoundException;
import com.enera.backend.exception.UserNotFoundException;
import com.enera.backend.repository.DeviceRepository;
import com.enera.backend.repository.FlatRepository;
import com.enera.backend.repository.ReadingRepository;
import com.enera.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@Service
public class FlatService {
    private final FlatRepository flatRepository;
    private final ReadingRepository readingRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private static final double LOW_KW_THRESHOLD = 2.0;
    private static final double MID_KW_THRESHOLD = 4.0;

    FlatService(FlatRepository flatRepository,
                ReadingRepository readingRepository,
                DeviceRepository deviceRepository,
                UserRepository userRepository){
        this.flatRepository = flatRepository;
        this.readingRepository = readingRepository;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
    }
    public FlatLiveResponse getFlatLive(Long flatId){
        Flat flat = flatRepository.findById(flatId).
                orElseThrow(()-> new FlatNotFoundException("Flat not found"));

        Reading reading = readingRepository.findTopByDevice_Flat_IdOrderByTimestampDesc(flatId)
                .orElseThrow(()-> new ReadingNotFoundException("Reading not found"));

        Device device = deviceRepository.findByFlatId(flatId)
                .orElseThrow(()-> new DeviceNotFoundException("Device not found"));

        FlatLiveResponse response = new FlatLiveResponse();

        Double kw = reading.getKw();

        if (kw < LOW_KW_THRESHOLD) {
            response.setLevel("normal");
        } else if (kw < MID_KW_THRESHOLD) {
            response.setLevel("amber");
        } else {
            response.setLevel("high");
        }

        Double usualKw = readingRepository.findAverageKwByFlatId(flatId);

        Double currentKw = reading.getKw();

        response.setStatus(device.isStatus());
        response.setTimeStamp(reading.getTimestamp());
        response.setPctVsUsual( ( (currentKw - usualKw ) / usualKw) * 100);
        response.setLastReadingAt(reading.getTimestamp());
        response.setKw(reading.getKw());

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
        response.setEstCost(totalKwh * 8);
        response.setProjectedCost(projectedTotal * 8);
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

        Double pctChange = 0.0;

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

        Flat flat = flatRepository.findById(flatId).
                orElseThrow(() -> new FlatNotFoundException("Flat not found"));

        User user = userRepository.findById(flatId).
                orElseThrow(() -> new UserNotFoundException("User not found"));

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
}
