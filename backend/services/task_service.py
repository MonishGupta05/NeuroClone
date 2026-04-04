import urllib.parse
import re
import requests as req

def generate_ai_image(prompt: str) -> dict:
    encoded = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=768&height=768&nologo=true&enhance=true&model=flux"
    return {
        "type": "ai_image",
        "url": url,
        "prompt": prompt,
        "source": "Pollinations AI",
        "downloadable": True
    }

def search_web_images(query: str) -> dict:
    try:
        encoded = urllib.parse.quote(query)
        resp = req.get(f"https://lexica.art/api/v1/search?q={encoded}", timeout=10)
        if resp.status_code == 200:
            images = resp.json().get("images", [])[:6]
            if images:
                return {
                    "type": "image_search",
                    "images": [{"url": img["src"], "prompt": img.get("prompt", query)} for img in images],
                    "query": query,
                    "source": "Lexica.art"
                }
    except Exception:
        pass
    return generate_ai_image(query)

def detect_task_intent(message: str) -> dict:
    msg = message.lower()

    gen_patterns = [
        r"generate (?:an? )?(?:ai )?(?:image|photo|picture|pic) (?:of )?(.+)",
        r"create (?:an? )?(?:image|photo|picture) (?:of )?(.+)",
        r"make (?:an? )?(?:image|photo|picture) (?:of )?(.+)",
        r"draw (?:me )?(.+)",
        r"ai image (?:of )?(.+)",
    ]
    for pattern in gen_patterns:
        match = re.search(pattern, msg)
        if match:
            subject = match.group(1).strip().rstrip(".")
            return {"type": "generate_image", "subject": subject, "detected": True}

    search_patterns = [
        r"download (?:an? )?(?:image|photo|picture) (?:of )?(.+)",
        r"find (?:an? )?(?:image|photo|picture) (?:of )?(.+)",
        r"search (?:for )?(?:an? )?(?:image|photo|picture) (?:of )?(.+)",
        r"get (?:me )?(?:an? )?(?:image|photo|picture) (?:of )?(.+)",
        r"download (.+?) (?:image|photo|picture|photos|images)",
    ]
    for pattern in search_patterns:
        match = re.search(pattern, msg)
        if match:
            subject = match.group(1).strip().rstrip(".")
            return {"type": "search_image", "subject": subject, "detected": True}

    return {"detected": False}