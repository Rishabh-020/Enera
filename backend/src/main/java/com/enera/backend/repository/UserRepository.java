package com.enera.backend.repository;

import com.enera.backend.entity.Builder;
import com.enera.backend.entity.Flat;
import com.enera.backend.entity.Role;
import com.enera.backend.entity.Society;
import com.enera.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findBySociety(Society society);

    List<User> findBySocietyAndRole(Society society, Role role);

    List<User> findByFlat(Flat flat);

    Optional<User> findByFlatAndRole(Flat flat, Role role);

    List<User> findByBuilder(Builder builder);

    List<User> findByBuilderAndRole(Builder builder, Role role);

    Optional<User> findByFlatId(Long flatId);
}