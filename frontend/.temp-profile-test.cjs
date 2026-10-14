/* Headless Chrome CDP test for the Profile page.
   Covers: load/errors, nav active state, header placeholders,
   edit modal open/save/validation, localStorage persistence,
   my clubs empty state, registrations empty state, account settings stubs,
   Explore links, and responsive width. */
const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://127.0.0.1:5173/pages/profile.html';

const failures = [];
const passes = [];
function ok(label) { passes.push(label); }
function bad(label, extra) { failures.push(label + (extra ? ' :: ' + extra : '')); }

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function launchChrome() {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless', '--disable-gpu', '--no-sandbox',
      '--disable-extensions', '--disable-dev-shm-usage',
      '--disable-background-networking', '--disable-sync',
      '--window-size=1366,768',
      '--remote-debugging-port=9222', '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-profile'
    ];
    const proc = spawn(CHROME, args, { stdio: 'pipe' });
    proc.stdout.on('data', () => {});
    proc.stderr.on('data', () => {});
    let tries = 0;
    const iv = setInterval(async () => {
      try {
        const data = await httpGet('http://127.0.0.1:9222/json/version');
        if (data) {
          clearInterval(iv);
          resolve(proc);
        }
      } catch {
        if (++tries > 40) { clearInterval(iv); reject(new Error('Chrome did not start')); }
      }
    }, 250);
  });
}

async function getWsUrl() {
  const data = await httpGet('http://127.0.0.1:9222/json/version');
  return JSON.parse(data).webSocketDebuggerUrl;
}

async function run() {
  const proc = await launchChrome();
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const callbacks = new Map();

  const wsReady = new Promise((resolve) => {
    ws.on('open', () => resolve());
    ws.on('error', (err) => { bad('WebSocket error: ' + (err.message || err)); resolve(); });
  });

  await wsReady;
  ok('CDP WebSocket connection established');

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      cb(msg);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const err = msg.params && msg.params.exceptionDetails && msg.params.exceptionDetails.exception && msg.params.exceptionDetails.exception.description;
      if (err) bad('Runtime exception: ' + err.substring(0, 240));
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params && msg.params.args || [];
      if (args[0] && args[0].value && /error/i.test(args[0].value)) {
        bad('console.error: ' + args[0].value.substring(0, 200));
      }
    }
  });

  function send(method, params) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    });
  }

  try { await send('Storage.clearDataForOrigin', { origin: 'http://127.0.0.1:5173', storageTypes: 'all' }); } catch (e) {}

  await send('Network.enable');
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Runtime.setExceptionsCapture', { state: 'verbose' });
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });

  process.stdout.write('Loading profile page... ');
  await send('Page.navigate', { url: BASE });
  await new Promise((r) => setTimeout(r, 3000));

  function evalFn(expr) {
    return send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }).then((r) => r.result && r.result.result && r.result.result.value);
  }

  ok('page loaded and rendered');

  // Nav active
  const profileActive = await evalFn('document.querySelector("a[data-nav=\\"profile\\"]").classList.contains("is-active")');
  if (profileActive) ok('Profile nav item is active'); else bad('Profile nav NOT active');

  // Header placeholders
  const heroName = await evalFn('document.getElementById("profileName").textContent');
  const heroEmail = await evalFn('document.getElementById("profileEmail").textContent');
  const heroId = await evalFn('document.querySelector("#profileHeroStudentId span").textContent');
  if (/student name/i.test(heroName)) ok('Hero name shows placeholder ("Student Name")'); else bad('Hero name', heroName);
  if (/email not available/i.test(heroEmail)) ok('Hero email shows placeholder'); else bad('Hero email', heroEmail);
  if (/student id not available/i.test(heroId)) ok('Hero student ID shows placeholder'); else bad('Hero ID', heroId);

  // Personal info placeholder
  const infoId = await evalFn('document.getElementById("infoStudentId").textContent');
  if (/student id not available/i.test(infoId)) ok('Personal info Student ID shows placeholder'); else bad('Personal info ID', infoId);

  // My Clubs empty state
  const clubsEmptyHidden = await evalFn('document.getElementById("myClubsEmpty").hidden');
  const clubsGridHidden = await evalFn('document.getElementById("myClubsGrid").hidden');
  if (clubsEmptyHidden === false && clubsGridHidden === true) ok('My Clubs empty state ("No clubs joined yet")'); else bad('My Clubs empty state', 'emptyHidden=' + clubsEmptyHidden + ' gridHidden=' + clubsGridHidden);

  // My Registrations empty state
  const regEmptyHidden = await evalFn('document.getElementById("myRegistrationsEmpty").hidden');
  const regListHidden = await evalFn('document.getElementById("myRegistrationsList").hidden');
  if (regEmptyHidden === false && regListHidden === true) ok('My Event Registrations empty state'); else bad('Registrations empty state', 'emptyHidden=' + regEmptyHidden + ' listHidden=' + regListHidden);

  // Account settings buttons
  const pwBtn = await evalFn('!!document.getElementById("changePasswordBtn")');
  const logoutBtn = await evalFn('!!document.getElementById("logoutBtn")');
  const prefsBtn = await evalFn('!!document.getElementById("notificationPrefsBtn")');
  if (pwBtn) ok('Change Password button present'); else bad('Change Password button missing');
  if (logoutBtn) ok('Logout button present'); else bad('Logout button missing');
  if (prefsBtn) ok('Notification Preferences button present'); else bad('Notification Preferences button missing');

  // Edit Profile modal: open, validate, save, persist
  process.stdout.write('\nEdit profile flow: ');
  await evalFn('document.querySelector("[data-open-edit-profile]").click()');
  await new Promise((r) => setTimeout(r, 500));
  const modalHidden = await evalFn('document.getElementById("editProfileModal").hidden');
  if (modalHidden === false) ok('Edit Profile modal opens'); else bad('Modal did not open');

  // Save with empty -> validation error
  await evalFn('document.getElementById("editProfileSave").click()');
  await new Promise((r) => setTimeout(r, 300));
  const nameError = await evalFn('document.getElementById("fullNameError").textContent');
  if (/enter your full name/i.test(nameError)) ok('Validation blocks empty name'); else bad('Validation empty name', nameError);
  const modalStillOpen = await evalFn('document.getElementById("editProfileModal").hidden');
  if (modalStillOpen === false) ok('Modal stays open on validation failure'); else bad('Modal closed despite error');

  // Fill valid data, save
  await evalFn('document.getElementById("fullName").value="Aarav Sharma"; document.getElementById("phone").value="+91 98765 43210"; document.getElementById("department").value="Computer Science"; document.getElementById("academicYear").value="2026-2027"');
  await new Promise((r) => setTimeout(r, 200));
  await evalFn('document.getElementById("editProfileSave").click()');
  await new Promise((r) => setTimeout(r, 600));
  const modalClosed = await evalFn('document.getElementById("editProfileModal").hidden');
  const savedHeroName = await evalFn('document.getElementById("profileName").textContent');
  const savedInfoName = await evalFn('document.getElementById("infoFullName").textContent');
  if (modalClosed === true) ok('Modal closes after valid save'); else bad('Modal did not close after save');
  if (savedHeroName === 'Aarav Sharma') ok('Hero name updated immediately'); else bad('Hero name not updated', savedHeroName);
  if (savedInfoName === 'Aarav Sharma') ok('Personal info name updated immediately'); else bad('Info name not updated', savedInfoName);

  // localStorage persistence
  const stored = await evalFn('window.localStorage.getItem("scms_user_profile")');
  let parsed = null;
  try { parsed = JSON.parse(stored); } catch (e) { parsed = null; }
  if (parsed && parsed.fullName === 'Aarav Sharma') ok('Profile persisted to localStorage (scms_user_profile)'); else bad('localStorage persistence', stored);

  // Cancel button
  await evalFn('document.querySelector("[data-open-edit-profile]").click()');
  await new Promise((r) => setTimeout(r, 300));
  await evalFn('document.getElementById("editProfileCancel").click()');
  await new Promise((r) => setTimeout(r, 300));
  const modalAfterCancel = await evalFn('document.getElementById("editProfileModal").hidden');
  if (modalAfterCancel === true) ok('Cancel button closes modal'); else bad('Cancel did not close modal');

  // Notification preference persists
  await evalFn('document.getElementById("notificationPrefsBtn").click()');
  await new Promise((r) => setTimeout(r, 300));
  await evalFn('document.getElementById("prefClubAnnouncements").checked=false; document.getElementById("prefClubAnnouncements").dispatchEvent(new Event("change",{bubbles:true}))');
  await new Promise((r) => setTimeout(r, 400));
  const prefStored = await evalFn('JSON.parse(window.localStorage.getItem("scms_user_profile")).preferences.clubAnnouncements');
  if (prefStored === false) ok('Notification preference persisted'); else bad('Notification pref not persisted', prefStored);

  // Nav links (check each href directly to avoid serializing element arrays)
  const dashHref = await evalFn('document.querySelector("a[data-nav=\\"dashboard\\"]").getAttribute("href")');
  const clubsHref = await evalFn('document.querySelector("a[data-nav=\\"clubs\\"]").getAttribute("href")');
  const eventsHref = await evalFn('document.querySelector("a[data-nav=\\"events\\"]").getAttribute("href")');
  const profileHref = await evalFn('document.querySelector("a[data-nav=\\"profile\\"]").getAttribute("href")');
  if (dashHref === 'dashboard.html') ok('Dashboard nav link -> dashboard.html'); else bad('Dashboard nav link wrong', dashHref);
  if (clubsHref === 'club.html') ok('Clubs nav link -> club.html'); else bad('Clubs nav link wrong', clubsHref);
  if (eventsHref === 'events.html') ok('Events nav link -> events.html'); else bad('Events nav link wrong', eventsHref);
  if (profileHref === 'profile.html') ok('Profile nav link -> profile.html'); else bad('Profile nav link wrong', profileHref);

  // Explore links
  const exploreClubs = await evalFn('!!document.querySelector("#myClubsEmpty a[href=\\"club.html\\"]")');
  const exploreEvents = await evalFn('!!document.querySelector("#myRegistrationsEmpty a[href=\\"events.html\\"]")');
  if (exploreClubs) ok('Explore Clubs button links to club.html'); else bad('Explore Clubs button missing');
  if (exploreEvents) ok('Explore Events button links to events.html'); else bad('Explore Events button missing');

  // Responsive: no horizontal overflow at 375px
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 400));
  const scrollWidth = await evalFn('document.documentElement.scrollWidth');
  const clientWidth = await evalFn('document.documentElement.clientWidth');
  if (scrollWidth <= clientWidth + 1) ok('No horizontal overflow at 375px mobile'); else bad('Horizontal overflow at 375px', 'scroll=' + scrollWidth + ' client=' + clientWidth);

  // ---- Summary ----
  console.log('\n========================================');
  console.log('PROFILE PAGE TEST RESULTS');
  console.log('========================================');
  console.log('PASSED (' + passes.length + '):');
  passes.forEach((p) => console.log('  + ' + p));
  console.log('\nFAILED (' + failures.length + '):');
  failures.forEach((f) => console.log('  - ' + f));
  console.log('\n' + (failures.length === 0 ? 'ALL CHECKS PASSED' : failures.length + ' FAILURE(S)'));
  console.log('========================================');

  ws.close();
  proc.kill();
  process.exit(failures.length === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('TEST RUNNER ERROR:', err);
  process.exit(2);
});
