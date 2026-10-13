const state = {
  employees: [],
  status: "All",
  department: "All",
  query: "",
  compact: false,
  selected: new Set(),
};

const $ = (selector) => document.querySelector(selector);
const rows = $("#employee-rows");
const form = $("#employee-form");
const modal = $("#employee-modal");
const toast = $("#toast");
let toastTimer;

$("#today-date").textContent = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date()).toUpperCase();
$("#current-year").textContent = new Date().getFullYear();

const icons = {
  edit: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.8 4.2 3 3M4 16l3.2-.7 8.6-8.6a2.1 2.1 0 0 0-3-3l-8.6 8.6L4 16Z"/></svg>',
  trash: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 6h11m-9.8 0 .6 10h7.4l.6-10M8 6V4h4v2m-3 3v4m2-4v4"/></svg>',
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function avatarColor(name) {
  const colors = ["lavender", "peach", "mint", "sky", "rose", "sand"];
  const total = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[total % colors.length];
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}

function visibleEmployees() {
  const query = state.query.trim().toLowerCase();
  return state.employees.filter((employee) => {
    const matchesStatus = state.status === "All" || employee.status === state.status;
    const matchesDepartment = state.department === "All" || employee.department === state.department;
    const matchesQuery = !query || [employee.name, employee.email, employee.role, employee.department]
      .some((value) => value.toLowerCase().includes(query));
    return matchesStatus && matchesDepartment && matchesQuery;
  });
}

function render() {
  const employees = visibleEmployees();
  const activeCount = state.employees.filter((employee) => employee.status === "Active").length;
  const leaveCount = state.employees.filter((employee) => employee.status === "On Leave").length;
  const departments = [...new Set(state.employees.map((employee) => employee.department))].sort();

  $("#total-count").textContent = state.employees.length;
  $("#active-count").textContent = activeCount;
  $("#leave-count").textContent = leaveCount;
  $("#department-count").textContent = departments.length;
  $("#nav-count").textContent = state.employees.length;
  $("#table-count").textContent = employees.length;
  $("#all-tab-count").textContent = state.employees.length;
  $("#active-tab-count").textContent = activeCount;
  $("#filter-count").textContent = Number(state.department !== "All") + Number(Boolean(state.query));
  $("#table-hint").textContent = employees.length === state.employees.length
    ? "Showing everyone in your workspace"
    : `Showing ${employees.length} of ${state.employees.length} people`;
  $("#result-summary").textContent = employees.length
    ? `Showing ${employees.length} ${employees.length === 1 ? "person" : "people"}`
    : "No people match these filters";

  const departmentFilter = $("#department-filter");
  const selectedDepartment = state.department;
  departmentFilter.innerHTML = '<option value="All">All departments</option>'
    + departments.map((department) => `<option value="${escapeHtml(department)}">${escapeHtml(department)}</option>`).join("");
  departmentFilter.value = selectedDepartment;

  document.querySelectorAll(".tab").forEach((tab) => {
    const selected = tab.dataset.status === state.status;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });

  $("#employee-panel").classList.toggle("compact", state.compact);
  if (!employees.length) {
    rows.innerHTML = `<tr><td colspan="7" class="empty-cell"><span class="empty-icon">⌕</span><strong>No people found</strong><span>Try changing your search or filters.</span><button class="text-button" type="button" data-reset-filters>Clear filters</button></td></tr>`;
    return;
  }

  rows.innerHTML = employees.map((employee) => {
    const safeName = escapeHtml(employee.name);
    const safeEmail = escapeHtml(employee.email);
    const statusClass = employee.status.toLowerCase().replace(/\s+/g, "-");
    return `<tr>
      <td><div class="person-cell"><span class="person-avatar ${avatarColor(employee.name)}">${escapeHtml(initials(employee.name))}</span><span class="person-copy"><strong>${safeName}</strong><small>${safeEmail}</small></span></div></td>
      <td><span class="status-badge ${statusClass}"><i></i>${escapeHtml(employee.status)}</span></td>
      <td class="role-cell">${escapeHtml(employee.role)}</td>
      <td><span class="department-label"><i class="department-dot ${avatarColor(employee.department)}"></i>${escapeHtml(employee.department)}</span></td>
      <td class="salary-cell">${formatCurrency(employee.salary)}</td>
      <td class="date-cell">${formatDate(employee.joinDate)}</td>
      <td><div class="row-actions"><button class="row-action" type="button" data-edit="${employee.id}" aria-label="Edit ${safeName}">${icons.edit}</button><button class="row-action danger" type="button" data-delete="${employee.id}" aria-label="Delete ${safeName}">${icons.trash}</button></div></td>
    </tr>`;
  }).join("");
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result.message || Object.values(result.errors || {}).join(" ");
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return result;
}

async function loadEmployees() {
  rows.innerHTML = '<tr><td colspan="7" class="loading-cell"><span class="spinner"></span> Loading your team…</td></tr>';
  try {
    state.employees = await request("/api/employees");
    render();
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="7" class="empty-cell error-cell"><strong>We couldn’t load your team</strong><span>${escapeHtml(error.message)}</span><button class="text-button" type="button" data-retry>Try again</button></td></tr>`;
    $("#result-summary").textContent = "Unable to load people";
    showToast("Couldn’t connect to the employee service.", "error");
  }
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast visible ${type}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3400);
}

function openModal(employee) {
  form.reset();
  $("#form-error").hidden = true;
  $("#employee-id").value = employee?.id || "";
  $("#modal-title").textContent = employee ? "Edit person" : "Add a person";
  $("#save-button").textContent = employee ? "Save changes" : "Add person";
  form.elements.name.value = employee?.name || "";
  form.elements.email.value = employee?.email || "";
  form.elements.role.value = employee?.role || "";
  form.elements.status.value = employee?.status || "Active";
  form.elements.salary.value = employee?.salary ?? 800000;
  form.elements.joinDate.value = employee?.joinDate || new Date().toISOString().slice(0, 10);

  const departmentSelect = form.elements.department;
  const knownDepartments = [...new Set([...state.employees.map((person) => person.department), employee?.department].filter(Boolean))];
  for (const department of knownDepartments) {
    if (![...departmentSelect.options].some((option) => option.value === department)) {
      departmentSelect.add(new Option(department, department));
    }
  }
  departmentSelect.value = employee?.department || "";

  modal.hidden = false;
  document.body.classList.add("modal-open");
  form.elements.name.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function exportCsv() {
  const employees = visibleEmployees();
  if (!employees.length) {
    showToast("There are no people to export.", "error");
    return;
  }
  const columns = ["Name", "Email", "Role", "Department", "Status", "Annual salary (INR)", "Date joined"];
  const csv = [columns, ...employees.map((employee) => [
    employee.name,
    employee.email,
    employee.role,
    employee.department,
    employee.status,
    employee.salary,
    employee.joinDate,
  ])].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  link.download = "india-integrated-people.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Your people list has been exported.");
}

$("#add-employee-button").addEventListener("click", () => openModal());
$("#export-button").addEventListener("click", exportCsv);
$("#search-input").addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});
$("#department-filter").addEventListener("change", (event) => {
  state.department = event.target.value;
  render();
});
$("#clear-filters").addEventListener("click", () => {
  state.department = "All";
  state.query = "";
  $("#search-input").value = "";
  render();
});
$("#view-button").addEventListener("click", () => {
  state.compact = !state.compact;
  render();
});
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  state.status = tab.dataset.status;
  render();
}));
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const employeeId = $("#employee-id").value;
  const employee = Object.fromEntries(new FormData(form));
  employee.salary = Number(employee.salary);
  const saveButton = $("#save-button");
  saveButton.disabled = true;
  saveButton.textContent = "Saving…";
  $("#form-error").hidden = true;

  try {
    await request(employeeId ? `/api/employees/${employeeId}` : "/api/employees", {
      method: employeeId ? "PUT" : "POST",
      body: JSON.stringify(employee),
    });
    closeModal();
    await loadEmployees();
    showToast(employeeId ? "Person details updated." : "New person added to your team.");
  } catch (error) {
    $("#form-error").textContent = error.message;
    $("#form-error").hidden = false;
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = employeeId ? "Save changes" : "Add person";
  }
});

rows.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    const employee = state.employees.find((person) => person.id === Number(editButton.dataset.edit));
    if (employee) openModal(employee);
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    const employee = state.employees.find((person) => person.id === Number(deleteButton.dataset.delete));
    if (!employee || !window.confirm(`Remove ${employee.name} from your team? This cannot be undone.`)) return;
    try {
      await request(`/api/employees/${employee.id}`, { method: "DELETE" });
      await loadEmployees();
      showToast(`${employee.name} was removed.`);
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }

  if (event.target.closest("[data-reset]")) {
    state.status = "All";
    state.department = "All";
    state.query = "";
    $("#search-input").value = "";
    render();
  }
  if (event.target.closest("[data-retry]")) loadEmployees();
});

document.querySelectorAll("[data-view]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  const view = link.dataset.view;
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === link));
  $("#breadcrumb-current").textContent = view === "overview" ? "Overview" : view === "departments" ? "Departments" : view === "reports" ? "Reports" : "People";
  if (view === "overview") {
    $("#page-title").textContent = "Good morning, Ananya";
    $("#page-subtitle").textContent = "Here’s what’s happening with your team today.";
    $(".stat-grid").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (view === "departments") {
    $("#page-title").textContent = "Departments";
    $("#page-subtitle").textContent = "See the people and teams across your organization.";
    $("#department-filter").focus();
    $("#employee-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (view === "reports") {
    showToast("Your people report is ready to export.");
  } else {
    $("#page-title").textContent = "People";
    $("#page-subtitle").textContent = "A little overview of the people who make your team great.";
  }
}));

$("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("mobile-open"));
document.querySelectorAll(".main-nav .nav-link").forEach((link) => link.addEventListener("click", () => {
  $("#sidebar").classList.remove("mobile-open");
}));

loadEmployees();
