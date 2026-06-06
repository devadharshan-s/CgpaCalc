package org.example.cgpacalc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@SpringBootApplication
@EnableWebMvc
public class CgpaCalcApplication {

    public static void main(String[] args) {
        SpringApplication.run(CgpaCalcApplication.class, args);
    }

}
