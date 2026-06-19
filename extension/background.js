const DEFAULT_APP_URL = "http://localhost:3000";
const ALARM_NAME = "vault-pulse";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 15 });
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) updateBadge();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.appUrl) updateBadge();
});

async function getAppUrl() {
  const { appUrl } = await chrome.storage.sync.get({
    appUrl: DEFAULT_APP_URL,
  });
  return normalizeAppUrl(appUrl);
}

function normalizeAppUrl(value) {
  return (value || DEFAULT_APP_URL).replace(/\/+$/, "");
}

async function updateBadge() {
  try {
    const appUrl = await getAppUrl();
    const response = await fetch(`${appUrl}/api/extension/summary`);
    if (!response.ok) throw new Error(`Vault returned ${response.status}`);
    const summary = await response.json();
    const attention =
      summary.needsReview + summary.overdue + summary.dueSoon;

    await chrome.action.setBadgeText({
      text: attention > 0 ? String(Math.min(attention, 99)) : "",
    });
    await chrome.action.setBadgeBackgroundColor({
      color: summary.overdue > 0 ? "#dc2626" : "#6366f1",
    });
    await chrome.action.setTitle({
      title:
        attention > 0
          ? `${attention} Vault item${attention === 1 ? "" : "s"} need attention`
          : "Vault Account Manager",
    });
  } catch {
    await chrome.action.setBadgeText({ text: "!" });
    await chrome.action.setBadgeBackgroundColor({ color: "#71717a" });
    await chrome.action.setTitle({ title: "Vault unavailable" });
  }
}
