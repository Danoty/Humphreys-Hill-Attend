let scanner = null;

function getEvents() {
  return JSON.parse(localStorage.getItem("hha_events") || "[]");
}

function saveEvents(events) {
  localStorage.setItem("hha_events", JSON.stringify(events));
}

function getParticipants() {
  return JSON.parse(localStorage.getItem("hha_participants") || "[]");
}

function saveParticipants(participants) {
  localStorage.setItem("hha_participants", JSON.stringify(participants));
}

function getAttendance() {
  return JSON.parse(localStorage.getItem("hha_attendance") || "[]");
}

function saveAttendance(attendance) {
  localStorage.setItem("hha_attendance", JSON.stringify(attendance));
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(section => section.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  refreshUI();
}

function createEvent() {
  const name = document.getElementById("eventName").value.trim();
  const type = document.getElementById("eventType").value;
  const venue = document.getElementById("eventVenue").value.trim() || "Humphreys Hill House";
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  if (!name || !start || !end) {
    alert("Please fill event name, start date, and end date.");
    return;
  }

  const events = getEvents();
  events.push({
    id: "EVT-" + Date.now(),
    name,
    type,
    venue,
    start,
    end,
    createdAt: new Date().toISOString()
  });

  saveEvents(events);

  document.getElementById("eventName").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  alert("Event created successfully.");
  refreshUI();
}

function registerParticipant() {
  const eventId = document.getElementById("participantEvent").value;
  const fullName = document.getElementById("fullName").value.trim();

  if (!eventId || !fullName) {
    alert("Please select an event and enter participant name.");
    return;
  }

  const participants = getParticipants();
  const participantId = "P-" + Date.now();

  participants.push({
    id: participantId,
    eventId,
    fullName,
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    organization: document.getElementById("organization").value.trim(),
    position: document.getElementById("position").value.trim(),
    qrValue: "HHA|" + eventId + "|" + participantId,
    createdAt: new Date().toISOString()
  });

  saveParticipants(participants);

  document.getElementById("fullName").value = "";
  document.getElementById("email").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("organization").value = "";
  document.getElementById("position").value = "";

  alert("Participant registered successfully.");
  refreshUI();
}

function checkIn(qrValue) {
  const parts = qrValue.split("|");
  if (parts.length !== 3 || parts[0] !== "HHA") {
    alert("Invalid QR code.");
    return;
  }

  const eventId = parts[1];
  const participantId = parts[2];
  const sessionName = document.getElementById("sessionName").value.trim() || "Main Session";

  const participant = getParticipants().find(p => p.id === participantId && p.eventId === eventId);

  if (!participant) {
    alert("Participant not found.");
    return;
  }

  const attendance = getAttendance();
  const duplicate = attendance.find(a =>
    a.participantId === participantId &&
    a.eventId === eventId &&
    a.sessionName === sessionName
  );

  if (duplicate) {
    alert(participant.fullName + " is already checked in for " + sessionName + ".");
    return;
  }

  attendance.push({
    id: "ATT-" + Date.now(),
    eventId,
    participantId,
    sessionName,
    checkInTime: new Date().toLocaleString()
  });

  saveAttendance(attendance);
  alert(participant.fullName + " checked in successfully.");
  refreshUI();
}

function manualCheckIn() {
  const value = document.getElementById("manualQr").value.trim();
  if (!value) {
    alert("Enter QR value first.");
    return;
  }
  checkIn(value);
  document.getElementById("manualQr").value = "";
}

function startScanner() {
  if (scanner) {
    alert("Scanner is already running.");
    return;
  }

  scanner = new Html5Qrcode("reader");
  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    decodedText => {
      checkIn(decodedText);
    },
    errorMessage => {}
  ).catch(err => {
    alert("Camera scanner failed to start. You can still use manual QR entry.");
  });
}

function stopScanner() {
  if (!scanner) return;
  scanner.stop().then(() => {
    scanner.clear();
    scanner = null;
  });
}

function refreshUI() {
  renderDashboard();
  renderEvents();
  renderEventOptions();
  renderParticipants();
  renderAttendance();
}

function renderDashboard() {
  document.getElementById("totalEvents").innerText = getEvents().length;
  document.getElementById("totalParticipants").innerText = getParticipants().length;
  document.getElementById("totalAttendance").innerText = getAttendance().length;
}

function renderEvents() {
  const events = getEvents();
  const container = document.getElementById("eventList");

  if (!events.length) {
    container.innerHTML = "<p>No events created yet.</p>";
    return;
  }

  container.innerHTML = events.map(event => `
    <div class="event-card">
      <h3>${escapeHTML(event.name)}</h3>
      <p><strong>Type:</strong> ${escapeHTML(event.type)}</p>
      <p><strong>Venue:</strong> ${escapeHTML(event.venue)}</p>
      <p><strong>Date:</strong> ${escapeHTML(event.start)} to ${escapeHTML(event.end)}</p>
    </div>
  `).join("");
}

function renderEventOptions() {
  const events = getEvents();
  const select = document.getElementById("participantEvent");

  select.innerHTML = events.map(event => `
    <option value="${event.id}">${escapeHTML(event.name)}</option>
  `).join("");
}

function renderParticipants() {
  const participants = getParticipants();
  const events = getEvents();
  const container = document.getElementById("participantList");

  if (!participants.length) {
    container.innerHTML = "<p>No participants registered yet.</p>";
    return;
  }

  container.innerHTML = participants.map(p => {
    const event = events.find(e => e.id === p.eventId);
    const qrId = "qr-" + p.id;
    setTimeout(() => {
      const el = document.getElementById(qrId);
      if (el && !el.dataset.done) {
        QRCode.toCanvas(el, p.qrValue, { width: 120 });
        el.dataset.done = "yes";
      }
    }, 10);

    return `
      <div class="participant-card">
        <h3>${escapeHTML(p.fullName)}</h3>
        <p><strong>Event:</strong> ${escapeHTML(event ? event.name : "Unknown Event")}</p>
        <p><strong>Organization:</strong> ${escapeHTML(p.organization || "")}</p>
        <p><strong>Role:</strong> ${escapeHTML(p.position || "")}</p>
        <p><strong>QR Value:</strong> ${escapeHTML(p.qrValue)}</p>
        <div class="qr-box"><canvas id="${qrId}"></canvas></div>
        <button onclick="printBadge('${p.id}')">Print Badge</button>
      </div>
    `;
  }).join("");
}

function renderAttendance() {
  const attendance = getAttendance();
  const participants = getParticipants();
  const events = getEvents();
  const container = document.getElementById("attendanceList");

  if (!attendance.length) {
    container.innerHTML = "<p>No attendance records yet.</p>";
    return;
  }

  container.innerHTML = `
    <table>
      <tr>
        <th>Participant</th>
        <th>Event</th>
        <th>Session</th>
        <th>Check-in Time</th>
      </tr>
      ${attendance.map(a => {
        const participant = participants.find(p => p.id === a.participantId);
        const event = events.find(e => e.id === a.eventId);
        return `
          <tr>
            <td>${escapeHTML(participant ? participant.fullName : "Unknown")}</td>
            <td>${escapeHTML(event ? event.name : "Unknown")}</td>
            <td>${escapeHTML(a.sessionName)}</td>
            <td>${escapeHTML(a.checkInTime)}</td>
          </tr>
        `;
      }).join("")}
    </table>
  `;
}

function downloadCSV() {
  const attendance = getAttendance();
  const participants = getParticipants();
  const events = getEvents();

  let rows = [["Participant", "Event", "Organization", "Phone", "Session", "Check-in Time"]];

  attendance.forEach(a => {
    const p = participants.find(x => x.id === a.participantId) || {};
    const e = events.find(x => x.id === a.eventId) || {};
    rows.push([
      p.fullName || "",
      e.name || "",
      p.organization || "",
      p.phone || "",
      a.sessionName,
      a.checkInTime
    ]);
  });

  downloadRowsAsCSV(rows, "humphreys_hill_attendance.csv");
}

function downloadParticipantsCSV() {
  const participants = getParticipants();
  const events = getEvents();

  let rows = [["Full Name", "Event", "Email", "Phone", "Organization", "Role", "QR Value"]];

  participants.forEach(p => {
    const e = events.find(x => x.id === p.eventId) || {};
    rows.push([
      p.fullName,
      e.name || "",
      p.email,
      p.phone,
      p.organization,
      p.position,
      p.qrValue
    ]);
  });

  downloadRowsAsCSV(rows, "humphreys_hill_participants.csv");
}

function downloadRowsAsCSV(rows, filename) {
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function printBadge(participantId) {
  const p = getParticipants().find(x => x.id === participantId);
  const event = getEvents().find(x => x.id === p.eventId);

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Badge</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 30px; }
          .badge { width: 320px; border: 2px solid #18392b; border-radius: 18px; padding: 20px; margin: auto; }
          h2 { color: #18392b; margin-bottom: 4px; }
          canvas { margin-top: 14px; }
        </style>
      </head>
      <body>
        <div class="badge">
          <h2>Humphreys Hill Attend</h2>
          <p>${escapeHTML(event ? event.name : "")}</p>
          <h1>${escapeHTML(p.fullName)}</h1>
          <p>${escapeHTML(p.organization || "")}</p>
          <p>${escapeHTML(p.position || "Participant")}</p>
          <canvas id="badgeQr"></canvas>
          <p>${escapeHTML(p.qrValue)}</p>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
        <script>
          QRCode.toCanvas(document.getElementById("badgeQr"), "${p.qrValue}", { width: 140 });
          setTimeout(() => window.print(), 500);
        <\/script>
      </body>
    </html>
  `);
}

function clearAllData() {
  if (!confirm("This will delete all events, participants and attendance records on this browser. Continue?")) return;
  localStorage.removeItem("hha_events");
  localStorage.removeItem("hha_participants");
  localStorage.removeItem("hha_attendance");
  refreshUI();
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

refreshUI();
