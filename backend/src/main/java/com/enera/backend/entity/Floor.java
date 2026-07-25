package com.enera.backend.entity;

import jakarta.persistence.*;


@Entity
@Table(name = "floors")
public class Floor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "block_id",nullable = false)
    private Block block;

    @Column(name = "floor_number", nullable = false)
    private Long floorNumber;
}
