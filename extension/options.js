const DEFAULT_APP_URL = "http://localhost:3000";

const appUrl = document.querySelector("#appUrl");
const save = document.querySelector("#save");
const status = document.querySelector("#status");

function normalizeUrl(value) {
  return (value || DEFAULT_APP_URL).replace(/\/+$/, "");
}

async function restoreOptions() {
  const settings = await chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL });
  appUrl.value = settings.appUrl;
}

save.addEventListener("click", async () => {
  const value = normalizeUrl(appUrl.value);
  await chrome.storage.sync.set({ appUrl: value });
  appUrl.value = value;
  status.textContent = "Saved.";
  setTimeout(() => {
    status.textContent = "";
  }, 1200);
});

restoreOptions();
