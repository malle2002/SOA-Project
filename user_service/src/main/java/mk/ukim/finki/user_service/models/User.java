package mk.ukim.finki.user_service.models;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotEmpty;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "users")
@Data
@Builder
public class User {
    @MongoId
    private String id;

    @NotEmpty(message = "Username is required")
    @Indexed(unique = true)
    private String username;

    @Email(message = "Email should be valid")
    @NotEmpty(message = "Email is required")
    @Indexed(unique = true)
    private String email;

    @NotEmpty(message = "Password is required")
    private String password;

    @NotEmpty(message = "First name is required")
    private String firstName;

    @NotEmpty(message = "Last name is required")
    private String lastName;

    private boolean enabled;

    private Set<Role> roles;
}
