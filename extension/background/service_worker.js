const BACKEND = "https://neuroclone.onrender.com/api/v1";
const LOCAL_BACKEND = "http://localhost:8000/api/v1";

async function callBackend(path, method = "GET", body = null) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  try {
    const res = await fetch(`${LOCAL_BACKEND}${path}`, options);
    return await res.json();
  } catch {
    try {
      const res = await fetch(`${BACKEND}${path}`, options);
      return await res.json();
    } catch { return null; }
  }
}

const DISTRACTION_SITES = [
  "instagram.com", "twitter.com", "x.com", "reddit.com",
  "netflix.com", "hotstar.com", "primevideo.com", "snapchat.com",
  "facebook.com", "tiktok.com", "9gag.com", "buzzfeed.com",
  "lordsmobile.com", "miniclip.com", "poki.com", "friv.com",
  "gamedistribution.com", "agame.com", "y8.com", "coolmathgames.com",
  "twitch.tv", "fmovies.to", "123movies.to", "sflix.to"
];

const FOCUS_SITES = [
  "github.com", "stackoverflow.com", "leetcode.com", "nptel.ac.in",
  "coursera.org", "pw.live", "geeksforgeeks.org", "kaggle.com",
  "claude.ai", "chatgpt.com", "notion.so", "docs.google.com",
  "scholar.google.com", "arxiv.org", "edx.org", "khanacademy.org",
  "udemy.com", "unacademy.com", "vedantu.com"
];

const STUDY_KEYWORDS = [
  "lecture", "tutorial", "course", "learn", "study", "education",
  "physics", "chemistry", "mathematics", "biology", "programming",
  "coding", "python", "javascript", "verilog", "vlsi", "gate",
  "engineering", "science", "concept", "explanation", "how to",
  "what is", "introduction to", "full course", "nptel", "pw",
  "circuit", "semiconductor", "digital", "analog", "electronics",
  "algorithm", "data structure", "machine learning", "revision",
  "notes", "exam", "preparation", "interview", "placement",
  "iit", "bits", "nit", "jee", "upsc", "lecture series"
];

const TIMEPASS_KEYWORDS = [
  "funny", "meme", "prank", "fails", "compilation", "satisfying",
  "asmr", "shorts", "reels", "viral", "trending", "reaction",
  "roast", "challenge", "vlog", "gaming", "gameplay", "entertainment",
  "comedy", "movie", "trailer", "music video", "song", "dance",
  "celebrity", "drama", "sports", "cricket", "football", "ipl",
  "random", "chill", "relax", "lofi", "masti", "timepass"
];

function classifyByContent(url, title, pageText) {
  const combined = `${url} ${title} ${pageText}`.toLowerCase();
  let hostname = "";
  try { hostname = new URL(url).hostname.replace("www.", ""); } catch { return { category: "neutral" }; }

  for (const site of DISTRACTION_SITES) {
    if (hostname.includes(site)) {
      return { category: "distraction", confidence: "high", reason: site };
    }
  }

  let studyScore = 0;
  let timepassScore = 0;

  for (const kw of STUDY_KEYWORDS) {
    if (combined.includes(kw)) studyScore += (title.toLowerCase().includes(kw) ? 2 : 1);
  }
  for (const kw of TIMEPASS_KEYWORDS) {
    if (combined.includes(kw)) timepassScore += (title.toLowerCase().includes(kw) ? 2 : 1);
  }

  if (hostname.includes("youtube.com")) {
    if (url.includes("/shorts")) return { category: "distraction", confidence: "high", reason: "YouTube Shorts", studyScore, timepassScore };
    if (url === "https://www.youtube.com/" || url.includes("/feed/")) return { category: "distraction", confidence: "medium", reason: "YouTube browsing", studyScore, timepassScore };
    if (studyScore > timepassScore && studyScore >= 2) return { category: "focus", confidence: "medium", reason: "study content", studyScore, timepassScore };
    if (timepassScore > studyScore && timepassScore >= 2) return { category: "distraction", confidence: "medium", reason: "entertainment", studyScore, timepassScore };
    return { category: "neutral", confidence: "low", studyScore, timepassScore };
  }

  for (const site of FOCUS_SITES) {
    if (hostname.includes(site)) return { category: "focus", confidence: "high", reason: site };
  }

  if (studyScore >= 3 && studyScore > timepassScore) return { category: "focus", confidence: "medium", studyScore, timepassScore };
  if (timepassScore >= 3 && timepassScore > studyScore) return { category: "distraction", confidence: "medium", studyScore, timepassScore };
  if (combined.includes("game") && combined.includes("play")) return { category: "distraction", confidence: "medium", reason: "gaming" };

  return { category: "neutral", confidence: "low" };
}

const DISTRACTION_MESSAGES = [
  (site, title) => `Bhai, "${title || site}" seriously? GATE backlog yaad hai? 370 videos left.`,
  (site) => `You opened ${site} for timepass. Your future self is watching. Close it.`,
  (site) => `Bhai ek kaam kar — ${site} band kar aur ek PW video dekh. Bas ek.`,
  (site) => `${site} can wait. VLSI nahi seekha toh kaun rokega? Close it.`,
  (site, title) => `Ratan Tata ne kya "${title || site}" dekha tha? Close it bhai.`,
];

const FOCUS_MESSAGES = [
  (site, title) => `Solid bhai. "${title || site}" — this is the Monish who wins. Stay here.`,
  () => `Good track. Study mode ON. Don't switch tabs now.`,
  (site, title) => `This is what consistency looks like. Finish "${title || site}" completely.`,
  () => `Bhai yahi karna tha. Stay focused. Don't drift.`,
  () => `Keep going. Every minute here counts toward that GATE rank.`,
];

// Smart Reminder — track last focus activity
let lastFocusTime = Date.now();
let reminderInterval = null;

function startReminderCheck() {
  if (reminderInterval) clearInterval(reminderInterval);
  reminderInterval = setInterval(async () => {
    const minutesSinceLastFocus = (Date.now() - lastFocusTime) / (1000 * 60);
    if (minutesSinceLastFocus >= 45) {
      const mins = Math.round(minutesSinceLastFocus);
      const messages = [
        `Bhai ${mins} minutes ho gaye. Kuch kiya? PW khol.`,
        `${mins} min idle. Ek video toh dekh GATE ki. Bas ek.`,
        `Bhai ${mins} minutes from last focus session. Back to work.`,
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];

      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0] && !tabs[0].url.startsWith("chrome://")) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: showSmartOverlay,
              args: [message, "reminder"]
            });
          } catch {}
        }
      });
    }
  }, 5 * 60 * 1000); // check every 5 minutes
}

startReminderCheck();

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) return;
    await analyzeTab(tab);
  } catch {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://")) {
    await analyzeTab(tab);
  }
});

async function analyzeTab(tab) {
  try {
    const url = tab.url;
    const title = tab.title || "";
    let hostname = "";
    try { hostname = new URL(url).hostname.replace("www.", ""); } catch { return; }

    let pageText = "";
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const headings = Array.from(document.querySelectorAll("h1, h2, h3, [class*='title'], [class*='heading']"))
            .map(el => el.textContent?.trim()).filter(Boolean).join(" ");
          const meta = document.querySelector('meta[name="description"]')?.content || "";
          const ytTitle = document.querySelector("yt-formatted-string.ytd-video-primary-info-renderer")?.textContent || "";
          const ytChip = Array.from(document.querySelectorAll("yt-formatted-string.ytd-rich-metadata-renderer"))
            .map(e => e.textContent).join(" ");
          return `${headings} ${meta} ${ytTitle} ${ytChip}`.slice(0, 600);
        }
      });
      pageText = results?.[0]?.result || "";
    } catch {}

    const classification = classifyByContent(url, title, pageText);

    // Update last focus time
    if (classification.category === "focus") {
      lastFocusTime = Date.now();
    }

    await callBackend("/activity", "POST", { url, site: hostname });

    if (classification.category === "distraction") {
      const msg = DISTRACTION_MESSAGES[Math.floor(Math.random() * DISTRACTION_MESSAGES.length)](hostname, title);
      chrome.storage.local.set({ lastWarning: { message: msg, site: hostname, title, time: Date.now() } });
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showSmartOverlay,
          args: [msg, "distraction"]
        });
      } catch {}
    } else if (classification.category === "focus") {
      const msg = FOCUS_MESSAGES[Math.floor(Math.random() * FOCUS_MESSAGES.length)](hostname, title);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showSmartOverlay,
          args: [msg, "focus"]
        });
      } catch {}
    }
  } catch {}
}

function showSmartOverlay(message, type) {
  const existing = document.getElementById("neuroclone-overlay");
  if (existing) {
    existing.style.animation = "ncFadeOut 0.2s ease forwards";
    setTimeout(() => existing?.remove(), 200);
  }

  const colors = {
    distraction: { accent: "#ef4444", bg: "rgba(239,68,68,0.08)", label: "⚠️ FOCUS ALERT" },
    focus: { accent: "#10b981", bg: "rgba(16,185,129,0.08)", label: "✅ ON TRACK" },
    reminder: { accent: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "⏰ REMINDER" },
  };
  const c = colors[type] || colors.reminder;

  const div = document.createElement("div");
  div.id = "neuroclone-overlay";
  div.style.cssText = `
    position:fixed;top:20px;right:20px;z-index:2147483647;width:300px;
    background:rgba(3,3,8,0.95);border:1px solid ${c.accent}44;border-radius:14px;
    padding:14px;box-shadow:0 0 40px ${c.accent}25,0 8px 32px rgba(0,0,0,0.7);
    font-family:'Inter',system-ui,sans-serif;backdrop-filter:blur(20px);
    animation:ncSlideIn 0.35s cubic-bezier(0.16,1,0.3,1);
  `;

  div.innerHTML = `
    <style>
      @keyframes ncSlideIn{from{transform:translateX(120px);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes ncFadeOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120px);opacity:0}}
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <div style="width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#0891b2,#7c3aed);
        display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:white;
        box-shadow:0 0 10px rgba(34,211,238,0.3);flex-shrink:0;">N</div>
      <div style="flex:1;">
        <div style="color:${c.accent};font-size:8px;font-weight:800;letter-spacing:1.5px;">${c.label}</div>
        <div style="color:rgba(255,255,255,0.4);font-size:9px;">NeuroClone</div>
      </div>
      <button onclick="const el=document.getElementById('neuroclone-overlay');el.style.animation='ncFadeOut 0.3s ease forwards';setTimeout(()=>el?.remove(),300);"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:5px;
        width:22px;height:22px;color:rgba(255,255,255,0.4);cursor:pointer;font-size:13px;
        display:flex;align-items:center;justify-content:center;">×</button>
    </div>
    <div style="background:${c.bg};border:1px solid ${c.accent}20;border-radius:9px;padding:10px 12px;margin-bottom:10px;">
      <p style="color:rgba(255,255,255,0.85);font-size:12px;line-height:1.6;margin:0;">${message}</p>
    </div>
    <div style="display:flex;gap:6px;">
      <button onclick="const el=document.getElementById('neuroclone-overlay');el.style.animation='ncFadeOut 0.3s ease forwards';setTimeout(()=>el?.remove(),300);"
        style="flex:1;padding:6px;border-radius:7px;background:rgba(255,255,255,0.06);
        border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);font-size:10px;
        cursor:pointer;font-family:inherit;">Dismiss</button>
      ${type === "distraction" ? `<button onclick="window.close()"
        style="flex:1;padding:6px;border-radius:7px;background:linear-gradient(135deg,#0891b2,#7c3aed);
        border:none;color:white;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;
        box-shadow:0 0 12px rgba(34,211,238,0.2);">Close Tab</button>` : ""}
      ${type === "reminder" ? `<button onclick="window.open('https://pw.live','_blank');document.getElementById('neuroclone-overlay')?.remove();"
        style="flex:1;padding:6px;border-radius:7px;background:linear-gradient(135deg,#0891b2,#7c3aed);
        border:none;color:white;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;">Open PW →</button>` : ""}
    </div>
  `;

  document.body.appendChild(div);
  const timeout = type === "distraction" ? 12000 : type === "reminder" ? 15000 : 7000;
  setTimeout(() => {
    const el = document.getElementById("neuroclone-overlay");
    if (el) { el.style.animation = "ncFadeOut 0.3s ease forwards"; setTimeout(() => el?.remove(), 300); }
  }, timeout);
}