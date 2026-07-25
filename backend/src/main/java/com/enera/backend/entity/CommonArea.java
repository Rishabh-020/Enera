package com.enera.backend.entity;

import jakarta.persistence.*;


@Entity
@Table(name = "common_areas")
public class CommonArea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long  id;

    @ManyToOne
    @JoinColumn(name = "society_id",nullable = false)
    private Society society;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(name = "floor_or_location", nullable = false)
    private String floorOrLocation;
}
