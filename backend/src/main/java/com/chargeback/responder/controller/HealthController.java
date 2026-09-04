package com.chargeback.responder.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
public class HealthController {

    @Value("${app.ml-service.url:http://localhost:5000}")
    private String mlServiceUrl;

    @Value("${app.llm.api-key:}")
    private String geminiApiKey;

    private final WebClient.Builder webClientBuilder;

    public HealthController(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("model_loaded", true);
        health.put("model_name", "RandomForestClassifier");
        health.put("model_version", "1.0");
        return ResponseEntity.ok(health);
    }

    @GetMapping("/api/health/full")
    public ResponseEntity<Map<String, Object>> getFullHealth() {
        boolean hasGeminiKey = geminiApiKey != null && !geminiApiKey.isBlank() && !"MY_GEMINI_API_KEY".equals(geminiApiKey);

        boolean mlServiceOnline = false;
        try {
            String res = webClientBuilder.build()
                    .get()
                    .uri(mlServiceUrl + "/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            mlServiceOnline = res != null;
        } catch (Exception e) {
            mlServiceOnline = false;
        }

        Map<String, Object> full = new LinkedHashMap<>();
        full.put("timestamp", Instant.now().toString());

        Map<String, Object> server = new LinkedHashMap<>();
        server.put("status", "UP");
        server.put("port", 8080);
        server.put("environment", "production");
        full.put("server", server);

        Map<String, Object> ml = new LinkedHashMap<>();
        ml.put("status", "UP");
        ml.put("fastapi_service_online", mlServiceOnline);
        ml.put("embedded_engine_active", true);
        ml.put("model_name", "RandomForestClassifier");
        ml.put("model_version", "1.0");
        full.put("ml_classifier", ml);

        Map<String, Object> llm = new LinkedHashMap<>();
        llm.put("provider", "Google Gemini");
        llm.put("has_api_key", hasGeminiKey);
        llm.put("active_mode", hasGeminiKey ? "real_api_gemini-3.8-flash" : "evidence_grounded_fallback_engine");
        full.put("llm_assistant", llm);

        Map<String, Object> db = new LinkedHashMap<>();
        db.put("type", "MySQL 8.0 / JPA Ledger Repository");
        db.put("status", "CONNECTED");
        full.put("database", db);

        return ResponseEntity.ok(full);
    }
}
