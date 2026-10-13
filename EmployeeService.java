package akhilproject;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employees;

    public EmployeeService(EmployeeRepository employees) {
        this.employees = employees;
    }

    @Transactional(readOnly = true)
    public List<Employee> findAll() {
        return employees.findAll();
    }

    @Transactional(readOnly = true)
    public Employee findById(Long id) {
        return employees.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
    }

    @Transactional
    public Employee create(Employee employee) {
        if (employees.existsByEmailIgnoreCase(employee.getEmail())) {
            throw new DuplicateEmployeeEmailException(employee.getEmail());
        }
        employee.setId(null);
        try {
            return employees.saveAndFlush(employee);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateEmployeeEmailException(employee.getEmail());
        }
    }

    @Transactional
    public Employee update(Long id, Employee changes) {
        Employee employee = findById(id);
        if (employees.existsByEmailIgnoreCaseAndIdNot(changes.getEmail(), id)) {
            throw new DuplicateEmployeeEmailException(changes.getEmail());
        }

        employee.setName(changes.getName());
        employee.setEmail(changes.getEmail());
        employee.setRole(changes.getRole());
        employee.setDepartment(changes.getDepartment());
        employee.setStatus(changes.getStatus());
        employee.setSalary(changes.getSalary());
        employee.setJoinDate(changes.getJoinDate());
        try {
            return employees.saveAndFlush(employee);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateEmployeeEmailException(changes.getEmail());
        }
    }

    @Transactional
    public void delete(Long id) {
        employees.delete(findById(id));
    }
}
