import { requireCoordinatorSession, readSession, clearSession } from "./nav.js";
const isCoordinator = requireCoordinatorSession();
const session = readSession();
function init() {
  const btn = document.getElementById("coordinatorLogoutBtn");
  if (btn) btn.addEventListener("click", () => { clearSession(); window.location.href = "../index.html"; });
}
if (isCoordinator) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}

