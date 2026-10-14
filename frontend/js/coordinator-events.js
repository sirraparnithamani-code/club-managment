let allClubEvents=[];
import { requireCoordinatorSession, readSession, clearSession } from "./nav.js";
import { createEvent, updateEvent, deleteEvent, publishEvent, cancelEvent, getClubEvents, EVENT_STATUS, STATUS_LABELS, getEventDataSource } from "./event-data.js";
import { escapeHtml } from "./dom.js";
import { showToast } from "./toast.js";

const isCoordinator = requireCoordinatorSession();

let currentClubId = null;

const dom = {};

function init() {
  const session = readSession();
  if (!session || !session.clubId) {
    showToast("No club assigned");
    return;
  }
  currentClubId = session.clubId;
  cacheDom();
  bindEvents();
  loadEvents();
}

function cacheDom() {
  dom.eventsListPanel = document.getElementById("eventsListPanel");
  dom.eventFormPanel = document.getElementById("eventFormPanel");
  dom.eventsBody = document.getElementById("eventsBody");
  dom.eventsFilterSelect = document.getElementById("eventsFilterSelect"); dom.searchInput = document.getElementById("eventsSearchInput");
  dom.newEventBtn = document.getElementById("newEventBtn");
  dom.cancelFormBtn = document.getElementById("cancelFormBtn");
  dom.eventForm = document.getElementById("eventForm");
  dom.formTitle = document.getElementById("formTitle");
  dom.eventId = document.getElementById("eventId");
  dom.eventTitle = document.getElementById("eventTitle");
  dom.eventCategory = document.getElementById("eventCategory");
  dom.eventDescription = document.getElementById("eventDescription");
  dom.eventStartDate = document.getElementById("eventStartDate");
  dom.eventStartTime = document.getElementById("eventStartTime");
  dom.eventEndDate = document.getElementById("eventEndDate");
  dom.eventEndTime = document.getElementById("eventEndTime");
  dom.eventVenue = document.getElementById("eventVenue");
  dom.eventSeats = document.getElementById("eventSeats");
  dom.eventRegistrationDeadline = document.getElementById("eventRegistrationDeadline");
  dom.eventRegistrationEnabled = document.getElementById("eventRegistrationEnabled");
  dom.eventContactEmail = document.getElementById("eventContactEmail");
  dom.eventContactPhone = document.getElementById("eventContactPhone");
  dom.eventEligibility = document.getElementById("eventEligibility");
  dom.eventBanner = document.getElementById("eventBanner");
  dom.saveDraftBtn = document.getElementById("saveDraftBtn");
  dom.publishBtn = document.getElementById("publishBtn");
  dom.saveBtn = document.getElementById("saveBtn");
  dom.logoutBtn = document.getElementById("coordinatorLogoutBtn");
  // Category cards container
  dom.categoryCards = document.getElementById("categoryCards");
  // Live summary elements
  dom.sumTitle = document.getElementById("sumTitle");
  dom.sumDate = document.getElementById("sumDate");
  dom.sumCategory = document.getElementById("sumCategory");
  dom.sumVenue = document.getElementById("sumVenue");
}

function bindEvents() {
  if (dom.newEventBtn) dom.newEventBtn.addEventListener("click", () => showCreateForm());
  if (dom.cancelFormBtn) dom.cancelFormBtn.addEventListener("click", () => hideForm());
  if (dom.eventsFilterSelect) dom.eventsFilterSelect.addEventListener("change", () => loadEvents());
  if (dom.saveDraftBtn) dom.saveDraftBtn.addEventListener("click", (e) => handleSave(e, true));
  if (dom.publishBtn) dom.publishBtn.addEventListener("click", (e) => handleSave(e, false));
  if (dom.eventForm) dom.eventForm.addEventListener("submit", (e) => handleEditSubmit(e));
  if (dom.logoutBtn) dom.logoutBtn.addEventListener("click", () => { clearSession(); window.location.href = "../index.html"; });
  // Live summary updates
  const summaryFields = [dom.eventTitle, dom.eventStartDate, dom.eventStartTime, dom.eventEndDate, dom.eventEndTime, dom.eventVenue, dom.eventCategory];
  summaryFields.forEach(field => {
    if (field) {
      field.addEventListener("input", updateLiveSummary);
      field.addEventListener("change", updateLiveSummary);
    }
  });
}

// Predefined categories
const CATEGORIES = ["Workshop", "Seminar", "Conference", "Social", "Sports", "Other", "Fundraiser", "Meeting"];

async function loadEvents() {
  allClubEvents = await getClubEvents(currentClubId); const events = allClubEvents.slice();
  const filter = dom.eventsFilterSelect ? dom.eventsFilterSelect.value : "all";
  const filtered = filter === "all" ? events : events.filter(e => e.status === filter);
  renderEvents(filtered);
}

function renderEvents(events) {
  if (!dom.eventsBody) return;
  const searchTerm = (dom.searchInput ? dom.searchInput.value : "").toLowerCase().trim(); let list = events; if (searchTerm) { list = events.filter(e => (e.title||"").toLowerCase().includes(searchTerm) || (e.venue||"").toLowerCase().includes(searchTerm) || (e.category||"").toLowerCase().includes(searchTerm)); } if (list.length === 0) {
    dom.eventsBody.innerHTML = "<tr><td colspan=7 style='text-align:center;padding:24px;color:var(--text-muted)'>No events found</td></tr>";
    return;
  }
  dom.eventsBody.innerHTML = list.sort((a,b) => new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0)).map(e => `
    <tr>
      <td>
        ${e.banner ? `<img src="${escapeHtml(e.banner)}" alt="Poster" class="event-poster-thumbnail">` : `<div class="event-poster-placeholder">No Poster</div>`}
      </td>
      <td><strong>${escapeHtml(e.title)}</strong></td>
      <td>${formatDateTime(e.startDate, e.startTime)}</td>
      <td>${escapeHtml(e.venue||"TBA")}</td>
      <td>${e.seats!==null?e.seatsTaken+"/"+e.seats:"Unlimited"}</td>
      <td><span class="admin-badge">${STATUS_LABELS[e.status]||e.status}</span></td>
      <td class="admin-actions">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${e.id}">Edit</button>
        ${e.status===EVENT_STATUS.DRAFT?"<button class=\"btn btn-primary btn-sm\" data-action=\"publish\" data-id=\""+e.id+"\">Publish</button>":""}
        ${e.status!==EVENT_STATUS.CANCELLED?"<button class=\"btn btn-secondary btn-sm\" data-action=\"cancel\" data-id=\""+e.id+"\">Cancel</button>":""}
        <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${e.id}" style="color:#dc2626;border-color:#fecaca">Delete</button>
      </td>
    </tr>`).join("");
  dom.eventsBody.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      if (action === "edit") { showEditForm(id); return; }
      if (action === "publish") { publishEvent(id); await loadEvents(); showToast("Event published"); return; }
      if (action === "cancel") { if (confirm("Cancel this event?")) { cancelEvent(id); await loadEvents(); showToast("Event cancelled"); } return; }
      if (action === "delete") { if (confirm("Delete this event? This cannot be undone.")) { deleteEvent(id); await loadEvents(); showToast("Event deleted"); } return; }
    });
  });
}

function showCreateForm() {
  dom.eventsListPanel.hidden = true;
  dom.eventFormPanel.hidden = false;
  dom.formTitle.textContent = "Create Event";
  dom.eventForm.reset();
  dom.eventId.value = "";
  dom.eventRegistrationEnabled.checked = false;
  dom.saveDraftBtn.hidden = false;
  dom.publishBtn.hidden = false;
  dom.saveBtn.hidden = true;
  renderCategoryCards(); // Render category cards for new event
  updateLiveSummary(); // Initialize live summary
  if (dom.eventStartDate) dom.eventStartDate.focus();
}

async function showEditForm(id) {
  allClubEvents = await getClubEvents(currentClubId); const events = allClubEvents.slice();
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  dom.eventsListPanel.hidden = true;
  dom.eventFormPanel.hidden = false;
  dom.formTitle.textContent = "Edit Event";
  dom.eventId.value = ev.id;
  dom.eventTitle.value = ev.title||"";
  dom.eventDescription.value = ev.description||"";
  dom.eventStartDate.value = ev.startDate||"";
  dom.eventStartTime.value = ev.startTime||"";
  dom.eventEndDate.value = ev.endDate||"";
  dom.eventEndTime.value = ev.endTime||"";
  dom.eventVenue.value = ev.venue||"";
  dom.eventSeats.value = ev.seats!==null?ev.seats:"";
  dom.eventRegistrationDeadline.value = ev.registrationDeadline||"";
  dom.eventRegistrationEnabled.checked = !!ev.registrationEnabled;
  dom.eventContactEmail.value = ev.contactEmail||"";
  dom.eventContactPhone.value = ev.contactPhone||"";
  dom.eventEligibility.value = ev.eligibility||"";
  dom.eventBanner.value = ev.banner||"";
  dom.saveDraftBtn.hidden = true;
  dom.publishBtn.hidden = true;
  dom.saveBtn.hidden = false;
  renderCategoryCards(ev.category); // Render category cards and set active
  updateLiveSummary(); // Initialize live summary
}

function hideForm() {
  dom.eventFormPanel.hidden = true;
  dom.eventsListPanel.hidden = false;
}

function collectFormData() {
  return {
    clubId: currentClubId,
    clubName: readSession()?.clubName||"",
    title: dom.eventTitle.value.trim(),
    category: dom.eventCategory.value.trim(),
    description: dom.eventDescription.value.trim(),
    startDate: dom.eventStartDate.value,
    startTime: dom.eventStartTime.value,
    endDate: dom.eventEndDate.value||dom.eventStartDate.value,
    endTime: dom.eventEndTime.value,
    venue: dom.eventVenue.value.trim(),
    seats: dom.eventSeats.value === "" ? null : Number(dom.eventSeats.value),
    registrationEnabled: dom.eventRegistrationEnabled.checked,
    registrationDeadline: dom.eventRegistrationDeadline.value,
    contactEmail: dom.eventContactEmail.value.trim(),
    contactPhone: dom.eventContactPhone.value.trim(),
    eligibility: dom.eventEligibility.value.trim(),
    banner: dom.eventBanner.value.trim()
  };
}

function handleSave(e, asDraft) {
  e.preventDefault();
  const data = collectFormData();
  if (!data.title || !data.category || !data.startDate) {
    showToast("Please fill required fields");
    return;
  }
  data.status = asDraft ? EVENT_STATUS.DRAFT : EVENT_STATUS.PUBLISHED;
  if (!asDraft && !data.publishedAt) data.publishedAt = new Date().toISOString();
  createEvent(data);
  showToast(asDraft ? "Draft saved" : "Event published");
  hideForm();
  loadEvents();
}

function handleEditSubmit(e) {
  e.preventDefault();
  const id = dom.eventId.value;
  if (!id) return;
  const data = collectFormData();
  if (!data.title || !data.category || !data.startDate) {
    showToast("Please fill required fields");
    return;
  }
  updateEvent(id, data);
  showToast("Event updated");
  hideForm();
  loadEvents();
}

function formatDateTime(date, time) {
  if (!date) return "TBA";
  const d = new Date(date + (time? "T"+time: ""));
  if (isNaN(d.getTime())) return date;
  return d.toLocaleString("en-US", {month:"short", day:"numeric", year:"numeric", hour:time?"numeric":"", minute:time?"2-digit":""}).replace(/,\s*$/, "");
}

// Category cards functionality
function renderCategoryCards(activeCategory = "") {
  if (!dom.categoryCards) return;
  // Clear existing cards
  dom.categoryCards.innerHTML = "";
  // Create cards for each category
  CATEGORIES.forEach(category => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.textContent = category;
    if (category === activeCategory) {
      card.classList.add("active");
    }
    card.addEventListener("click", () => {
      // Remove active class from all cards
      dom.categoryCards.querySelectorAll(".category-card").forEach(c => c.classList.remove("active"));
      // Add active class to clicked card
      card.classList.add("active");
      // Update hidden input
      dom.eventCategory.value = category;
      // Update live summary
      updateLiveSummary();
    });
    dom.categoryCards.appendChild(card);
  });
}

// Live summary functionality
function updateLiveSummary() {
  if (dom.sumTitle) dom.sumTitle.textContent = dom.eventTitle.value.trim() || "-";
  if (dom.sumDate) {
    const startDate = dom.eventStartDate.value;
    const startTime = dom.eventStartTime.value;
    const endDate = dom.eventEndDate.value;
    const endTime = dom.eventEndTime.value;
    let dateStr = "-";
    if (startDate) {
      dateStr = formatDateTime(startDate, startTime);
      if (endDate) {
        const endStr = formatDateTime(endDate, endTime);
        if (endStr !== "-") {
          dateStr += ` to ${endStr}`;
        }
      }
    }
    dom.sumDate.textContent = dateStr;
  }
  if (dom.sumCategory) dom.sumCategory.textContent = dom.eventCategory.value.trim() || "-";
  if (dom.sumVenue) dom.sumVenue.textContent = dom.eventVenue.value.trim() || "-";
}

// Initialize category cards on DOM load if needed
if (isCoordinator) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}