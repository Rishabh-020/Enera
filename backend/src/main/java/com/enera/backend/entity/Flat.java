package com.enera.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "flats")
public class Flat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id",nullable = false)
    private Floor floor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id",nullable = false)
    private Block block;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id",nullable = false)
    private Society society;

    @Column(name = "flat_number", nullable = false)
    private String flatNumber;

    @Column(name = "bhk_type", nullable = false)
    private String bhkType;

    @Column(nullable = false)
    private boolean status;
}
