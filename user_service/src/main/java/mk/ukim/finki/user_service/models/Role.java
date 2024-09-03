package mk.ukim.finki.user_service.models;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {
    ROLE_ADMIN,
    ROLE_USER,
    ROLE_MODERATOR,
    ROLE_GUEST;

    @Override
    public String getAuthority() {
        return name();
    }
}