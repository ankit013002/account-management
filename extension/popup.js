const DEFAULT_APP_URL = "http://localhost:3000";

const siteName = document.querySelector("#siteName");
const siteUrl = document.querySelector("#siteUrl");
const status = document.querySelector("#status");
const saveCurrent = document.querySelector("#saveCurrent");
const trackCurrent = document.querySelector("#trackCurrent");
const openToday = document.querySelector("#openToday");
const openVault = document.querySelector("#openVault");
const options = document.querySelector("#options");
const matches = document.querySelector("#matches");
const matchesList = document.querySelector("#matchesList");

let activeTab = null;

async function getSettings() {
  return chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL });
}

function normalizeAppUrl(value) {
  return (value || DEFAULT_APP_URL).replace(/\/+$/, "");
}

function buildNewAccountUrl(appUrl, tab) {
  const url = new URL(`${normalizeAppUrl(appUrl)}/accounts/new`);
  url.searchParams.set("name", tab.title || getHostname(tab.url) || "");
  if (tab.url) url.searchParams.set("url", tab.url);
  url.searchParams.set("tags", "browser, chrome-extension");
  return url.toString();
}

function buildCommandCenterUrl(appUrl, tab) {
  const url = new URL(`${normalizeAppUrl(appUrl)}/command-center`);
  url.searchParams.set("type", "subscription");
  url.searchParams.set("title", tab.title || getHostname(tab.url) || "");
  url.searchParams.set("provider", getHostname(tab.url));
  if (tab.url) url.searchParams.set("url", tab.url);
  url.searchParams.set("tags", "browser, chrome-extension");
  return url.toString();
}

function getHostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function loadActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  activeTab = tab ?? null;

  if (!activeTab) {
    siteName.textContent = "No active tab";
    siteUrl.textContent = "";
    saveCurrent.disabled = true;
    trackCurrent.disabled = true;
    return;
  }

  siteName.textContent = activeTab.title || getHostname(activeTab.url) || "Untitled";
  siteUrl.textContent = activeTab.url || "";
  await loadMatches(activeTab);
}

async function loadMatches(tab) {
  const domain = getHostname(tab.url);
  if (!domain) return;
  const { appUrl } = await getSettings();
  const url = new URL(`${normalizeAppUrl(appUrl)}/api/extension/accounts`);
  url.searchParams.set("domain", domain);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return;
    const accounts = await response.json();
    if (!accounts.length) return;

    matches.hidden = false;
    matchesList.replaceChildren(
      ...accounts.map((account) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "match";
        button.innerHTML = `<strong></strong><span></span>`;
        button.querySelector("strong").textContent = account.name;
        button.querySelector("span").textContent =
          account.username || account.email || account.url || "Saved account";
        button.addEventListener("click", async () => {
          await chrome.tabs.create({
            url: `${normalizeAppUrl(appUrl)}/accounts/${account.id}`,
          });
        });
        return button;
      }),
    );
    status.textContent = `${accounts.length} saved match${accounts.length === 1 ? "" : "es"}`;
  } catch {
    status.textContent = "Vault lookup unavailable";
  }
}

saveCurrent.addEventListener("click", async () => {
  if (!activeTab) return;
  const { appUrl } = await getSettings();
  await chrome.tabs.create({ url: buildNewAccountUrl(appUrl, activeTab) });
  status.textContent = "Opening account form";
});

trackCurrent.addEventListener("click", async () => {
  if (!activeTab) return;
  const { appUrl } = await getSettings();
  await chrome.tabs.create({ url: buildCommandCenterUrl(appUrl, activeTab) });
  status.textContent = "Opening command center";
});

openVault.addEventListener("click", async () => {
  const { appUrl } = await getSettings();
  await chrome.tabs.create({ url: normalizeAppUrl(appUrl) });
});

openToday.addEventListener("click", async () => {
  const { appUrl } = await getSettings();
  await chrome.tabs.create({ url: `${normalizeAppUrl(appUrl)}/today` });
});

options.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

loadActiveTab().catch((error) => {
  status.textContent = "Could not read this tab";
  siteName.textContent = "Unavailable";
  siteUrl.textContent = error instanceof Error ? error.message : "";
  saveCurrent.disabled = true;
});
