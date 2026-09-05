package com.chargeback.responder.repository;

import com.chargeback.responder.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    Optional<Dispute> findByCaseId(String caseId);
    void deleteByCaseId(String caseId);

    @Query("SELECT d FROM Dispute d WHERE " +
           "(:search IS NULL OR LOWER(d.caseId) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:reason IS NULL OR d.disputeReason = :reason) " +
           "ORDER BY d.createdAt DESC")
    List<Dispute> findWithFilters(@Param("search") String search, @Param("reason") String reason);
}
