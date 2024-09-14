package mk.ukim.mk.order_service.repository;

import mk.ukim.mk.order_service.models.OrderNotification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderNotificationRepository extends MongoRepository<OrderNotification, String> {
}
