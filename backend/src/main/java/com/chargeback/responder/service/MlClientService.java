package com.chargeback.responder.service;

import com.chargeback.responder.dto.MlPredictRequest;
import com.chargeback.responder.dto.MlPredictResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Service
public class MlClientService {

    private final WebClient webClient;

    public MlClientService(@Value("${app.ml-service.url:http://localhost:8000}") String mlServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(mlServiceUrl)
                .build();
    }

    public MlPredictResponse predictProbability(MlPredictRequest request) {
        try {
            return webClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(MlPredictResponse.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to invoke ML prediction service: " + ex.getMessage(), ex);
        }
    }
}
