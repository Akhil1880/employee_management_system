package akhilproject;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:employee-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.h2.console.enabled=false"
})
@AutoConfigureMockMvc
@Transactional
class EmployeeApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listsSeededEmployees() throws Exception {
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].email").exists());
    }

    @Test
    void createsUpdatesAndDeletesEmployee() throws Exception {
        String employee = """
                {
                  "name": "Jamie Lee",
                  "email": "jamie.lee@peopledesk.example",
                  "role": "Product Designer",
                  "department": "Design",
                  "status": "Active",
                  "salary": 860000,
                  "joinDate": "2025-05-12"
                }
                """;

        String created = mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(employee))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Jamie Lee"))
                .andReturn().getResponse().getContentAsString();

        long id = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(created).get("id").asLong();
        String updated = employee.replace("Jamie Lee", "Jamie Rivera");

        mockMvc.perform(put("/api/employees/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updated))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Jamie Rivera"));

        mockMvc.perform(delete("/api/employees/{id}", id))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/employees/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void rejectsInvalidAndDuplicateEmails() throws Exception {
        String invalidEmployee = """
                {
                  "name": "Invalid Person",
                  "email": "not-an-email",
                  "role": "Designer",
                  "department": "Design",
                  "status": "Active",
                  "salary": 80000,
                  "joinDate": "2025-05-12"
                }
                """;

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidEmployee))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());

        String duplicateEmail = invalidEmployee.replace("not-an-email", "aarav.sharma@peopledesk.example");
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateEmail))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }
}
