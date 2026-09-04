package com.chargeback.responder.controller;

import com.chargeback.responder.dto.CaseCreateDto;
import com.chargeback.responder.dto.CaseResponseDto;
import com.chargeback.responder.dto.PredictionDto;
import com.chargeback.responder.exception.InvalidCaseStateException;
import com.chargeback.responder.service.CaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CaseController {

    private final CaseService caseService;

    @PostMapping
    public ResponseEntity<CaseResponseDto> createCase(@Valid @RequestBody CaseCreateDto dto) {
        CaseResponseDto created = caseService.createCase(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<CaseResponseDto>> listCases(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dispute_reason,
            @RequestParam(required = false) String decision
    ) {
        List<CaseResponseDto> cases = caseService.listCases(search, dispute_reason, decision);
        return ResponseEntity.ok(cases);
    }

    @GetMapping("/{caseId}")
    public ResponseEntity<CaseResponseDto> getCase(@PathVariable String caseId) {
        CaseResponseDto caseDto = caseService.getCase(caseId);
        return ResponseEntity.ok(caseDto);
    }

    @PostMapping("/{caseId}/analyze")
    public ResponseEntity<PredictionDto> analyzeCase(@PathVariable String caseId) {
        PredictionDto prediction = caseService.analyzeCase(caseId);
        return ResponseEntity.ok(prediction);
    }

    @PostMapping("/{caseId}/generate-response")
    public ResponseEntity<com.chargeback.responder.dto.DefenseResponseDto> generateResponse(@PathVariable String caseId) {
        com.chargeback.responder.dto.DefenseResponseDto response = caseService.generateDefenseResponse(caseId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-demo")
    public ResponseEntity<Map<String, Object>> resetDemo() {
        List<CaseResponseDto> cases = caseService.resetDemo();
        Map<String, Object> result = Map.of(
                "message", "Demo cases reset to initial canonical state",
                "cases", cases
        );
        return ResponseEntity.ok(result);
    }
}
