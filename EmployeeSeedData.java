package akhilproject;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class EmployeeSeedData implements CommandLineRunner {

    private final EmployeeRepository employees;

    public EmployeeSeedData(EmployeeRepository employees) {
        this.employees = employees;
    }

    @Override
    public void run(String... args) {
        if (employees.count() != 0) {
            return;
        }
        employees.saveAll(List.of(
                employee("Aarav Sharma", "aarav.sharma@peopledesk.example", "Product Designer", "Design", "Active", "1080000", "2021-03-14"),
                employee("Isha Patel", "isha.patel@peopledesk.example", "Engineering Manager", "Engineering", "Active", "1450000", "2020-06-01"),
                employee("Ananya Reddy", "ananya.reddy@peopledesk.example", "Frontend Developer", "Engineering", "On Leave", "980000", "2022-09-19"),
                employee("Rohan Mehta", "rohan.mehta@peopledesk.example", "Marketing Lead", "Marketing", "Active", "1120000", "2019-11-04"),
                employee("Kavya Nair", "kavya.nair@peopledesk.example", "UX Researcher", "Design", "Active", "920000", "2023-02-27"),
                employee("Arjun Verma", "arjun.verma@peopledesk.example", "People Operations", "Human Resources", "Inactive", "870000", "2018-07-16")
        ));
    }

    private Employee employee(String name, String email, String role, String department,
                              String status, String salary, String joined) {
        return new Employee(name, email, role, department, status,
                new BigDecimal(salary), LocalDate.parse(joined));
    }
}
