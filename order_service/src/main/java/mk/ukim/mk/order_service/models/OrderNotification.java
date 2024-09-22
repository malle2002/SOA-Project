package mk.ukim.mk.order_service.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDateTime;

@Document(collection = "order-notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderNotification {
    @MongoId
    private String id;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime orderedOn;

    private String to;

    private String text;

    private String subject;

    public OrderNotification(LocalDateTime now, String to, String text, String subject) {
        this.orderedOn=now;
        this.to=to;
        this.text=text;
        this.subject=subject;
    }
}
