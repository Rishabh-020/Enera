package com.enera.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "blocks")
public class Block {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "society_id",nullable = false)
    private Society society;

    @Column(name = "block_name", nullable = false)
    private String blockName;
}
