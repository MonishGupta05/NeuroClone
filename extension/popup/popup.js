chrome.storage.local.get(["lastWarning"], (result) => {
  if (result.lastWarning) {
    document.getElementById("lastWarning").textContent = result.lastWarning.message;
  }
});

fetch("http://localhost:8000/api/v1/activity/recent")
  .then(r => r.json())
  .then(data => {
    const distractions = data.activity.filter(a => a.category === "distraction").length;
    const focus = data.activity.filter(a => a.category === "focus").length;
    document.getElementById("distCount").textContent = distractions;
    document.getElementById("focusCount").textContent = focus;
  })
  .catch(() => {});