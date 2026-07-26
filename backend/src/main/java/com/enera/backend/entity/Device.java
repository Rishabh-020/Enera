package com.enera.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import lombok.Data;

@Data
@Entity
@Table(name = "devices")
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_serial", nullable = false,unique = true)
    private Long deviceSerial;

    @Column(name = "device_type", nullable = false)
    private String deviceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mapped_flat_id")
    private Flat flat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mapped_common_area_id")
    private CommonArea commonArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id",nullable = false)
    private Society society;

    @Column(nullable = false)
    private boolean status;

    @CreationTimestamp
    @Column(name = "registered_at", nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

}
