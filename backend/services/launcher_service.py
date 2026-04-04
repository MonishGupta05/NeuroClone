import re

SITE_MAP = {
    "pw": "https://pw.live",
    "physics wallah": "https://pw.live",
    "youtube": "https://youtube.com",
    "instagram": "https://instagram.com",
    "github": "https://github.com",
    "leetcode": "https://leetcode.com",
    "notion": "https://notion.so",
    "google": "https://google.com",
    "stackoverflow": "https://stackoverflow.com",
    "geeksforgeeks": "https://geeksforgeeks.org",
    "gfg": "https://geeksforgeeks.org",
    "kaggle": "https://kaggle.com",
    "nptel": "https://nptel.ac.in",
    "gmail": "https://mail.google.com",
    "gate": "https://gate2026.iitr.ac.in",
}

SEARCH_ENGINES = {
    "youtube": "https://youtube.com/results?search_query=",
    "google": "https://google.com/search?q=",
}

def detect_launch_intent(message: str):
    msg = message.lower()

    # Detect search intent
    search_patterns = [
        r"search (.+) on (youtube|google)",
        r"find (.+) on (youtube|google)",
        r"look up (.+) on (youtube|google)",
        r"search for (.+)",
        r"look up (.+)",
    ]
    for pattern in search_patterns:
        match = re.search(pattern, msg)
        if match:
            query = match.group(1).strip()
            engine = "youtube" if "youtube" in msg else "google"
            url = SEARCH_ENGINES[engine] + query.replace(" ", "+")
            return {
                "intent": "search",
                "url": url,
                "description": f"Search '{query}' on {engine}",
                "detected": True
            }

    # Detect open intent
    open_patterns = [
        r"open (.+)",
        r"go to (.+)",
        r"launch (.+)",
        r"take me to (.+)",
        r"start (.+)",
    ]
    for pattern in open_patterns:
        match = re.search(pattern, msg)
        if match:
            target = match.group(1).strip().rstrip(".")
            for key, url in SITE_MAP.items():
                if key in target:
                    return {
                        "intent": "open",
                        "url": url,
                        "description": f"Open {key} ({url})",
                        "detected": True
                    }

    return {"detected": False}