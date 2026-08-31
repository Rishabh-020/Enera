package com.enera.backend.config;

import com.enera.backend.entity.*;
import com.enera.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DemoUserInitializer {

    public static final String DEMO_BUILDER_EMAIL = "demoBuilder@enera.com";
    public static final String DEMO_SOCIETY_EMAIL = "demoSociety@enera.com";
    public static final String DEMO_OWNER_EMAIL = "demoOwner@enera.com";
    public static final String DEMO_SOCIETY_NAME = "Sunrise Heights";

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
        if (isDemoFullySeeded()) {
            log.debug("Demo users and all demo details already exist in database. Skipping insertion.");
            return;
        }

        log.info("Demo user or details missing in database. Seeding demo environment...");
        Builder builder = seedBuilder();
        Society society = seedSociety(builder);
        seedBlocksFloorsFlats(society);
        seedCommonAreas(society);

        Flat flat1 = flatRepository.findByFloorBlockSocietyId(society.getId())
                .stream()
                .findFirst()
                .orElse(null);

        seedDevices(society);
        seedInitialReadings(society);
        seedDemoUsers(flat1, society, builder);
        log.info("Demo environment seeding completed successfully.");
    }

    private boolean isDemoFullySeeded() {
        boolean usersExist = userRepository.existsByEmail(DEMO_OWNER_EMAIL)
                && userRepository.existsByEmail(DEMO_SOCIETY_EMAIL)
                && userRepository.existsByEmail(DEMO_BUILDER_EMAIL);

        if (!usersExist) {
            return false;
        }

        Optional<Builder> builderOpt = builderRepository.findFirstByEmail(DEMO_BUILDER_EMAIL);
        if (builderOpt.isEmpty()) {
            return false;
        }

        Optional<Society> societyOpt = societyRepository.findFirstByBuilderAndName(builderOpt.get(), DEMO_SOCIETY_NAME);
        if (societyOpt.isEmpty()) {
            return false;
        }

        Society society = societyOpt.get();
        List<Block> blocks = blockRepository.findBySocietyId(society.getId());
        if (blocks.isEmpty()) {
            return false;
        }

        List<Flat> flats = flatRepository.findByFloorBlockSocietyId(society.getId());
        if (flats.isEmpty()) {
            return false;
        }

        List<Device> devices = deviceRepository.findBySocietyId(society.getId());
        if (devices.isEmpty()) {
            return false;
        }

        return true;
    }

    private Builder seedBuilder() {
        return builderRepository.findFirstByEmail(DEMO_BUILDER_EMAIL).orElseGet(() -> {
            Builder b = new Builder();
            b.setName("Enera Developments Ltd");
            b.setEmail(DEMO_BUILDER_EMAIL);
            log.info("Seeding demo Builder: {}", b.getName());
            return builderRepository.save(b);
        });
    }

    private Society seedSociety(Builder builder) {
        return societyRepository.findFirstByBuilderAndName(builder, DEMO_SOCIETY_NAME).orElseGet(() -> {
            Society s = new Society();
            s.setName(DEMO_SOCIETY_NAME);
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

    private void seedDevices(Society society) {
        List<Device> existingDevices = deviceRepository.findBySocietyId(society.getId());
        if (!existingDevices.isEmpty()) {
            return;
        }

        log.info("Seeding Devices for Society: {}", society.getName());
        List<Device> toSave = new ArrayList<>();

        // Seed Flat meters for all flats in demo society
        List<Flat> flats = flatRepository.findByFloorBlockSocietyId(society.getId());
        long flatSerial = 100001L;
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
                toSave.add(dev);
            }
            flatSerial++;
        }

        // Seed Common Area meters for demo society
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
                toSave.add(caDev);
            }
            caSerial++;
        }

        if (!toSave.isEmpty()) {
            deviceRepository.saveAll(toSave);
            log.info("Saved {} new demo devices.", toSave.size());
        }
    }

    private void seedInitialReadings(Society society) {
        List<Device> devices = deviceRepository.findBySocietyId(society.getId());
        if (devices.isEmpty()) {
            return;
        }

        // Check if readings already exist for this society's devices
        boolean hasExistingReadings = devices.stream()
                .anyMatch(d -> readingRepository.findTopByDeviceOrderByTimestampDesc(d).isPresent());
        if (hasExistingReadings) {
            return;
        }

        log.info("Generating and persisting realistic historical readings from Day 1 to Today for Demo Society...");

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
        seedUserIfMissing(DEMO_OWNER_EMAIL, "demoOwner@owner2007", "Aarav Sharma", Role.RESIDENT, flat1, society, builder);
        seedUserIfMissing(DEMO_SOCIETY_EMAIL, "demoSociety1@society2007", "Rajesh Mehta", Role.SOCIETY_ADMIN, null, society, builder);
        seedUserIfMissing(DEMO_BUILDER_EMAIL, "demoBuilder1@builder2007", "Vikram Singhania", Role.BUILDER_ADMIN, null, null, builder);
    }

    private void seedUserIfMissing(String email, String rawPassword, String name,
                                   Role role, Flat flat, Society society, Builder builder) {
        Optional<User> existing = userRepository.findFirstByEmail(email);
        if (existing.isEmpty()) {
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
        } else {
            // If demo user exists, ensure associations are correctly assigned
            User u = existing.get();
            boolean updated = false;
            if (u.getBuilder() == null && builder != null) {
                u.setBuilder(builder);
                updated = true;
            }
            if (u.getSociety() == null && society != null && role != Role.BUILDER_ADMIN) {
                u.setSociety(society);
                updated = true;
            }
            if (u.getFlat() == null && flat != null && role == Role.RESIDENT) {
                u.setFlat(flat);
                updated = true;
            }
            if (updated) {
                userRepository.save(u);
                log.info("Updated existing demo user associations: {}", email);
            }
        }
    }
}
