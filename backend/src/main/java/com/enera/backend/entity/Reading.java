package com.enera.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name= "readings")
public class Reading {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id",nullable = false)
    private Device device;

    @Column(nullable = false)
    private Double kw;

    @Column(nullable = false)
    private Double kwh;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @CreationTimestamp
    @Column(name = "created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;
}
