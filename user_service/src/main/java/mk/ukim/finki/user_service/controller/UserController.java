package mk.ukim.finki.user_service.controller;

import mk.ukim.finki.user_service.models.User;
import mk.ukim.finki.user_service.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/")
    public List<User> getUsers() {
        return userRepository.findAll();
    }
}
