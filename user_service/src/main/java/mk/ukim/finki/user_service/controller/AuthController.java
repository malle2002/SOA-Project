package mk.ukim.finki.user_service.controller;

import lombok.RequiredArgsConstructor;
import mk.ukim.finki.user_service.models.dto.LoginRequest;
import mk.ukim.finki.user_service.models.dto.LoginResponse;
import mk.ukim.finki.user_service.models.dto.RegisterRequest;
import mk.ukim.finki.user_service.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping(path = "/register")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(@RequestBody RegisterRequest registerRequest) {
        authService.register(registerRequest);
    }

    @PostMapping(path = "/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.login(loginRequest));
    }
}

