const DEFAULT_APP_URL = "http://localhost:3000";

const siteName = document.querySelector("#siteName");
const siteUrl = document.querySelector("#siteUrl");
const status = document.querySelector("#status");
const saveCurrent = document.querySelector("#saveCurrent");
const trackCurrent = document.querySelector("#trackCurrent");
const openToday = document.querySelector("#openToday");
const openSecurity = document.querySelector("#openSecurity");
const openEmergency = document.querySelector("#openEmergency");
const openVault = document.querySelector("#openVault");
const options = document.querySelector("#options");
const matchesList = document.querySelector("#matchesList");
const matchCount = document.querySelector("#matchCount");
const vaultSearch = document.querySelector("#vaultSearch");
const searchResults = document.querySelector("#searchResults");
const searchCount = document.querySelector("#searchCount");
const pulseGrid = document.querySelector("#pulseGrid");
const refreshPulse = document.querySelector("#refreshPulse");

let activeTab = null;
let appUrlCache = DEFAULT_APP_URL;
let allAccounts = [];
let allItems = [];

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

function getLogin(account) {
  return account.username || account.email || "";
}

function setStatus(message) {
  status.textContent = message;
}

async function openAppPath(path = "") {
  await chrome.tabs.create({ url: `${appUrlCache}${path}` });
}

async function copyText(value, label) {
  if (!value) {
    setStatus(`No ${label} saved`);
    return;
  }
  await navigator.clipboard.writeText(value);
  setStatus(`${label} copied`);
}

function createAccountCard(account, { matched = false } = {}) {
  const card = document.createElement("article");
  card.className = "account-card";

  const top = document.createElement("div");
  top.className = "account-top";

  const details = document.createElement("div");
  details.style.minWidth = "0";

  const title = document.createElement("strong");
  title.className = "account-title";
  title.textContent = account.name;

  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = getLogin(account) || account.url || account.category || "Saved account";

  details.append(title, meta);
  top.append(details);

  if (matched) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "match";
    top.append(badge);
  }

  const actions = document.createElement("div");
  actions.className = "account-actions";
  actions.append(
    makeSmallButton("Open", () => openAppPath(`/accounts/${account.id}`)),
    makeSmallButton("Login", () => copyText(getLogin(account), "Login")),
    makeSmallButton("Site", () => {
      if (account.url) chrome.tabs.create({ url: account.url });
      else setStatus("No site saved");
    }),
  );

  card.append(top, actions);
  return card;
}

function createItemCard(item) {
  const card = document.createElement("article");
  card.className = "item-card";

  const top = document.createElement("div");
  top.className = "item-top";

  const details = document.createElement("div");
  details.style.minWidth = "0";

  const title = document.createElement("strong");
  title.className = "item-title";
  title.textContent = item.title;

  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = [
    item.type,
    item.provider,
    item.renewalDate || item.dueDate,
  ]
    .filter(Boolean)
    .join(" - ");

  details.append(title, meta);
  top.append(details);

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.status || "item";
  top.append(badge);

  const actions = document.createElement("div");
  actions.className = "item-actions";
  actions.append(
    makeSmallButton("Open", () =>
      openAppPath(`/command-center?q=${encodeURIComponent(item.title)}`),
    ),
    makeSmallButton("URL", () => {
      if (item.url) chrome.tabs.create({ url: item.url });
      else setStatus("No URL saved");
    }),
    makeSmallButton("Copy", () =>
      copyText(item.identifier || item.location || item.provider, "Item detail"),
    ),
  );

  card.append(top, actions);
  return card;
}

function makeSmallButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderMatches(accounts) {
  matchCount.textContent = accounts.length ? String(accounts.length) : "";
  matchesList.replaceChildren(
    ...(accounts.length
      ? accounts.map((account) => createAccountCard(account, { matched: true }))
      : [emptyText("No saved matches yet")]),
  );
}

function renderSearchResults(accounts) {
  const query = vaultSearch.value.trim().toLowerCase();
  if (!query) {
    searchCount.textContent = "";
    searchResults.replaceChildren();
    return;
  }

  const accountResults = accounts
    .filter((account) =>
      [
        account.name,
        account.username,
        account.email,
        account.url,
        account.category,
        ...(account.tags || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    )
    .slice(0, 4);

  const itemResults = allItems
    .filter((item) =>
      [
        item.title,
        item.provider,
        item.url,
        item.status,
        item.type,
        item.location,
        item.identifier,
        item.notes,
        ...(item.tags || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    )
    .slice(0, 4);

  const total = accountResults.length + itemResults.length;

  searchCount.textContent = total ? String(total) : "0";
  searchResults.replaceChildren(
    ...(total
      ? [
          ...accountResults.map((account) => createAccountCard(account)),
          ...itemResults.map((item) => createItemCard(item)),
        ]
      : [emptyText("No matching accounts or items")]),
  );
}

function renderPulse(summary) {
  const metrics = [
    ["Review", summary.needsReview, summary.needsReview ? "warning" : ""],
    ["Overdue", summary.overdue, summary.overdue ? "danger" : ""],
    ["Due soon", summary.dueSoon, summary.dueSoon ? "warning" : ""],
    ["Accounts", summary.accounts, ""],
    ["Items", summary.vaultItems, ""],
    ["Monthly", `$${Number(summary.monthlySpend || 0).toFixed(0)}`, ""],
  ];

  pulseGrid.replaceChildren(
    ...metrics.map(([label, value, tone]) => {
      const card = document.createElement("div");
      card.className = `pulse ${tone}`;
      const strong = document.createElement("strong");
      strong.textContent = String(value);
      const span = document.createElement("span");
      span.textContent = label;
      card.append(strong, span);
      return card;
    }),
  );
}

function emptyText(text) {
  const element = document.createElement("span");
  element.className = "empty";
  element.textContent = text;
  return element;
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

  siteName.textContent =
    activeTab.title || getHostname(activeTab.url) || "Untitled";
  siteUrl.textContent = activeTab.url || "";
}

async function fetchAccounts(path) {
  const response = await fetch(`${appUrlCache}${path}`);
  if (!response.ok) throw new Error(`Vault returned ${response.status}`);
  return response.json();
}

async function loadVaultData() {
  const domain = getHostname(activeTab?.url);
  const [accounts, items, matches, summary] = await Promise.all([
    fetchAccounts("/api/accounts"),
    fetchAccounts("/api/vault-items"),
    domain
      ? fetchAccounts(`/api/extension/accounts?domain=${encodeURIComponent(domain)}`)
      : Promise.resolve([]),
    fetchAccounts("/api/extension/summary"),
  ]);

  allAccounts = accounts;
  allItems = items;
  renderPulse(summary);
  renderMatches(matches);
  renderSearchResults(allAccounts);
  setStatus(matches.length ? `${matches.length} saved match${matches.length === 1 ? "" : "es"}` : "Vault connected");
}

saveCurrent.addEventListener("click", async () => {
  if (!activeTab) return;
  await chrome.tabs.create({ url: buildNewAccountUrl(appUrlCache, activeTab) });
  setStatus("Opening account form");
});

trackCurrent.addEventListener("click", async () => {
  if (!activeTab) return;
  await chrome.tabs.create({
    url: buildCommandCenterUrl(appUrlCache, activeTab),
  });
  setStatus("Opening command center");
});

openVault.addEventListener("click", () => openAppPath(""));
openToday.addEventListener("click", () => openAppPath("/today"));
openSecurity.addEventListener("click", () => openAppPath("/security"));
openEmergency.addEventListener("click", () => openAppPath("/emergency-kit"));

options.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

vaultSearch.addEventListener("input", () => {
  renderSearchResults(allAccounts);
});

refreshPulse.addEventListener("click", async () => {
  try {
    const summary = await fetchAccounts("/api/extension/summary");
    renderPulse(summary);
    setStatus("Pulse refreshed");
  } catch {
    setStatus("Pulse unavailable");
  }
});

(async function init() {
  const { appUrl } = await getSettings();
  appUrlCache = normalizeAppUrl(appUrl);
  await loadActiveTab();
  await loadVaultData();
})().catch((error) => {
  setStatus("Vault unavailable");
  siteName.textContent = activeTab ? siteName.textContent : "Unavailable";
  siteUrl.textContent = error instanceof Error ? error.message : "";
  saveCurrent.disabled = !activeTab;
  trackCurrent.disabled = !activeTab;
});
