package mk.ukim.mk.order_service.service.impl;

import lombok.extern.log4j.Log4j2;
import mk.ukim.mk.order_service.service.MailService;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Log4j2
public class MailServiceImpl implements MailService {

    private final JavaMailSender javaMailSender;

    public MailServiceImpl(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }


    @Override
    public void sendMail(String to, String subject, String text) {
        log.info("Mail would be sent now to: "+to+"\nSubject: "+subject+"\nWith text: "+text);
    }
}
