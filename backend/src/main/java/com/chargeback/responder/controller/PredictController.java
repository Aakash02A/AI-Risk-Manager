package com.chargeback.responder.controller;

import com.chargeback.responder.dto.MlPredictRequest;
import com.chargeback.responder.dto.MlPredictResponse;
import com.chargeback.responder.service.MlClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PredictController {

    private final MlClientService mlClientService;

    @PostMapping("/predict")
    public ResponseEntity<MlPredictResponse> predict(@RequestBody MlPredictRequest request) {
        MlPredictResponse response = mlClientService.predictProbability(request);
        return ResponseEntity.ok(response);
    }
}
