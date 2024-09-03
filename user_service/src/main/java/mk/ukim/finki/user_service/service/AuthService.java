package mk.ukim.finki.user_service.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import mk.ukim.finki.user_service.models.Role;
import mk.ukim.finki.user_service.models.User;
import mk.ukim.finki.user_service.models.dto.LoginRequest;
import mk.ukim.finki.user_service.models.dto.LoginResponse;
import mk.ukim.finki.user_service.models.dto.RegisterRequest;
import mk.ukim.finki.user_service.repository.UserRepository;
import mk.ukim.finki.user_service.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    public void register(RegisterRequest registerRequest) {
        Set<Role> roles = new HashSet<>();
        roles.add(Role.ROLE_USER);
        User u = User.builder()
                .email(registerRequest.getEmail())
                .username(registerRequest.getUsername())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .enabled(true)
                .roles(roles)
                .build();
        userRepository.save(u);
    }

    public LoginResponse login(LoginRequest loginRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );
        User u = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow(() -> new EntityNotFoundException("User not found"));
        String token = jwtService.generateToken(u);
        return new LoginResponse(token, u);
    }
}
