package com.enera.backend.config;

import com.enera.backend.entity.*;
import com.enera.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DemoUserInitializer {

    private final BuilderRepository builderRepository;
    private final SocietyRepository societyRepository;
    private final BlockRepository blockRepository;
    private final FloorRepository floorRepository;
    private final FlatRepository flatRepository;
    private final CommonAreaRepository commonAreaRepository;
    private final DeviceRepository deviceRepository;
    private final ReadingRepository readingRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public synchronized void ensureDemoSeeded() {
        Builder builder = seedBuilder();
        Society society = seedSociety(builder);
        seedBlocksFloorsFlats(society);
        seedCommonAreas(society);
        
        Flat flat1 = flatRepository.findAll().stream().findFirst().orElse(null);
        seedDevices(society, flat1);
        seedInitialReadings(society);
        seedDemoUsers(flat1, society, builder);
    }

    private Builder seedBuilder() {
        return builderRepository.findByEmail("demoBuilder@enera.com").orElseGet(() -> {
            Builder b = new Builder();
            b.setName("Enera Developments Ltd");
            b.setEmail("demoBuilder@enera.com");
            log.info("Seeding demo Builder: {}", b.getName());
            return builderRepository.save(b);
        });
    }

    private Society seedSociety(Builder builder) {
        return societyRepository.findByBuilderAndName(builder,"Enera Developments Ltd").orElseGet(() -> {
            Society s = new Society();
            s.setName("Sunrise Heights");
            s.setBuilder(builder);
            s.setAddress("104 Green Valley Boulevard");
            s.setCity("Bengaluru");
            s.setTotalBlocks(4L);
            log.info("Seeding demo Society: {}", s.getName());
            return societyRepository.save(s);
        });
    }

    private void seedBlocksFloorsFlats(Society society) {
        List<Block> existingBlocks = blockRepository.findBySocietyId(society.getId());
        if (!existingBlocks.isEmpty()) {
            return;
        }

        log.info("Seeding Blocks, Floors, and Flats for Society: {}", society.getName());
        String[] blockNames = {"A", "B", "C", "D"};
        for (String bName : blockNames) {
            Block blk = new Block();
            blk.setSociety(society);
            blk.setBlockName(bName);
            blk = blockRepository.save(blk);

            for (long fl = 1; fl <= 5; fl++) {
                Floor floor = new Floor();
                floor.setBlock(blk);
                floor.setFloorNumber(fl);
                floor = floorRepository.save(floor);

                for (int f = 1; f <= 8; f++) {
                    Flat flat = new Flat();
                    flat.setFloor(floor);
                    flat.setFlatNumber(bName + "-" + fl + "0" + f);
                    flat.setBhkType((f == 1 || f == 5) ? "3 BHK" : "2 BHK");
                    flat.setStatus(true);
                    flatRepository.save(flat);
                }
            }
        }
    }

    private void seedCommonAreas(Society society) {
        List<CommonArea> existingCAs = commonAreaRepository.findBySocietyId(society.getId());
        if (!existingCAs.isEmpty()) {
            return;
        }

        log.info("Seeding Common Areas for Society: {}", society.getName());

        String[] commonAreaNames = {
                "Gym", "Lift 1", "Lift 2", "Service Lift",
                "Pump 1", "Overhead Tank Pump", "Swimming Pool Filtration",
                "EV Fast Charging Hub", "Security Gate & Hub"
        };

        for (String caName : commonAreaNames) {
            CommonArea ca = new CommonArea();
            ca.setSociety(society);
            ca.setName(caName);
            ca.setCategory(caName.contains("Lift") ? "Vertical Transport" :
                    caName.contains("Pump") ? "Water Management" :
                            caName.contains("Lighting") ? "Lighting" : "Amenities");
            ca.setFloorOrLocation("Ground / Central");
            commonAreaRepository.save(ca);
        }
    }

    private void seedDevices(Society society, Flat flat1) {
        long flatSerial = 100001L;

        // Seed Flat meters for all flats in society
        List<Flat> flats = flatRepository.findAll();
        for (Flat f : flats) {
            Optional<Device> existing = deviceRepository.findByFlatId(f.getId());
            if (existing.isEmpty()) {
                Device dev = new Device();
                dev.setDeviceSerial(flatSerial);
                dev.setDeviceType("FLAT_METER");
                dev.setFlat(f);
                dev.setSociety(society);
                dev.setStatus(true);
                dev.setLastSeenAt(LocalDateTime.now());
                deviceRepository.save(dev);
            }
            flatSerial++;
        }

        // Seed Common Area meters
        long caSerial = 900001L;
        List<CommonArea> allCAs = commonAreaRepository.findBySocietyId(society.getId());
        for (CommonArea ca : allCAs) {
            Optional<Device> existing = deviceRepository.findByCommonAreaId(ca.getId());
            if (existing.isEmpty()) {
                Device caDev = new Device();
                caDev.setDeviceSerial(caSerial);
                caDev.setDeviceType("COMMON_AREA_METER");
                caDev.setCommonArea(ca);
                caDev.setSociety(society);
                caDev.setStatus(true);
                caDev.setLastSeenAt(LocalDateTime.now());
                deviceRepository.save(caDev);
            }
            caSerial++;
        }
    }

    private void seedInitialReadings(Society society) {
        if (readingRepository.count() >= 1000) {
            return;
        }

        log.info("Generating and persisting realistic historical readings from Day 1 to Today in PostgreSQL...");
        List<Device> devices = deviceRepository.findAll();
        if (devices.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        int dayOfMonth = now.getDayOfMonth();

        List<Reading> batch = new ArrayList<>();
        Random random = new Random();

        for (Device dev : devices) {
            boolean isCommon = "COMMON_AREA_METER".equals(dev.getDeviceType());
            double baseKw = isCommon ? (4.0 + (random.nextDouble() * 5.0)) : (0.9 + (random.nextDouble() * 1.8));

            for (int dayOffset = dayOfMonth - 1; dayOffset >= 0; dayOffset--) {
                for (int hour = 0; hour < 24; hour += 2) {
                    LocalDateTime ts = now.minusDays(dayOffset).withHour(hour).withMinute(15).withSecond(0);
                    if (ts.isAfter(now)) continue;

                    double peakFactor = (hour >= 18 && hour <= 22) ? 1.4 : (hour >= 1 && hour <= 5) ? 0.35 : 0.9;
                    double jitter = 0.85 + (random.nextDouble() * 0.30);
                    double kw = Math.round((baseKw * peakFactor * jitter) * 100.0) / 100.0;
                    double kwh = Math.round((kw * 2.0) * 100.0) / 100.0;

                    Reading r = new Reading();
                    r.setDevice(dev);
                    r.setKw(kw);
                    r.setKwh(kwh);
                    r.setTimestamp(ts);
                    batch.add(r);
                }
            }
        }
        readingRepository.saveAll(batch);
        log.info("Successfully persisted {} historical readings into PostgreSQL database.", batch.size());
    }

    private void seedDemoUsers(Flat flat1, Society society, Builder builder) {
        seedUserIfMissing("demoOwner@enera.com", "demoOwner@owner2007", "Aarav Sharma", Role.RESIDENT, flat1, society, builder);
        seedUserIfMissing("demoSociety@enera.com", "demoSociety1@society2007", "Rajesh Mehta", Role.SOCIETY_ADMIN, null, society, builder);
        seedUserIfMissing("demoBuilder@enera.com", "demoBuilder1@builder2007", "Vikram Singhania", Role.BUILDER_ADMIN, null, null, builder);
    }

    private void seedUserIfMissing(String email, String rawPassword, String name,
                                   Role role, Flat flat, Society society, Builder builder) {
        if (!userRepository.existsByEmail(email)) {
            User u = new User();
            u.setEmail(email);
            u.setPasswordHash(passwordEncoder.encode(rawPassword));
            u.setName(name);
            u.setRole(role);
            u.setFlat(flat);
            u.setSociety(society);
            u.setBuilder(builder);
            userRepository.save(u);
            log.info("Seeded demo user: {} ({})", email, role);
        }
    }
}
