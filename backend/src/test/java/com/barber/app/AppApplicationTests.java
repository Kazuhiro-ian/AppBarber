package com.barber.app;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Sobe o contexto completo contra o H2, validando beans e mapeamento JPA. */
@SpringBootTest
@ActiveProfiles("test")
class AppApplicationTests {

	@Test
	void contextLoads() {
	}

}
