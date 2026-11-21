package in.kluniversity.events.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
public class EventRegistrationController {
    @GetMapping("/status")
    public ResponseEntity<String> getCampusEvents() {
        return ResponseEntity.ok("KLU Event Registration API Active");
    }
}
