package mk.ukim.finki.user_service.models.dto;

import lombok.Data;
import mk.ukim.finki.user_service.models.User;

@Data
public class LoginResponse {
    private String token;
    private String id;
    private String username;
    private String email;

    public LoginResponse(String token, User user) {
        this.token = token;
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
    }
}
