package com.enera.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "blocks", uniqueConstraints = {
        @UniqueConstraint(name = "uk_block_society_name", columnNames = {"society_id", "block_name"})
})
public class Block {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id",nullable = false)
    private Society society;

    @Column(name = "block_name", nullable = false)
    private String blockName;
}
