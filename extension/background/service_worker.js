const BACKEND = "http://localhost:8000/api/v1";

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url || tab.url.startsWith("chrome://")) return;
    checkSite(tab.url);
  } catch {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://")) {
    checkSite(tab.url);
  }
});

async function checkSite(url) {
  try {
    const site = new URL(url).hostname.replace("www.", "");
    const res = await fetch(`${BACKEND}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, site })
    });
    const data = await res.json();

    if (data.action === "warn") {
      chrome.storage.local.set({ lastWarning: { message: data.message, site, time: Date.now() } });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: showWarning,
            args: [data.message]
          });
        }
      });
    }
  } catch {}
}

function showWarning(message) {
  const existing = document.getElementById("monish-ai-warning");
  if (existing) existing.remove();

  const div = document.createElement("div");
  div.id = "monish-ai-warning";
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 1px solid #6366f1;
    border-radius: 12px;
    padding: 16px 20px;
    max-width: 320px;
    box-shadow: 0 8px 32px rgba(99,102,241,0.3);
    font-family: 'Inter', sans-serif;
    animation: slideIn 0.3s ease;
  `;

  div.innerHTML = `
    <style>
      @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    </style>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;">M</div>
      <span style="color:#a5b4fc;font-size:12px;font-weight:600;">MONISH AI</span>
      <button onclick="document.getElementById('monish-ai-warning').remove()" style="margin-left:auto;background:none;border:none;color:#555;cursor:pointer;font-size:16px;">×</button>
    </div>
    <p style="color:white;font-size:13px;line-height:1.5;margin:0;">${message}</p>
  `;

  document.body.appendChild(div);
  setTimeout(() => { if (div.parentNode) div.remove(); }, 8000);
}