import urllib.parse
import re
import requests as req
import random

IMAGE_PROMPTS_ENHANCE = [
    "highly detailed, 8k, professional photography, sharp focus",
    "cinematic lighting, ultra realistic, masterpiece",
    "digital art, trending on artstation, vibrant colors",
    "photorealistic, studio lighting, high resolution",
]

def generate_ai_image(prompt: str) -> dict:
    enhanced = f"{prompt}, {random.choice(IMAGE_PROMPTS_ENHANCE)}"
    encoded = urllib.parse.quote(enhanced)
    seed = random.randint(1, 99999)

    urls = [
        f"https://image.pollinations.ai/prompt/{encoded}?width=768&height=768&nologo=true&enhance=true&model=flux&seed={seed}",
        f"https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&nologo=true&model=flux&seed={seed}",
        f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?width=768&height=768&nologo=true&seed={seed}",
    ]

    return {
        "type": "ai_image",
        "url": urls[0],
        "fallback_urls": urls[1:],
        "prompt": prompt,
        "enhanced_prompt": enhanced,
        "source": "Pollinations AI (Flux)",
        "seed": seed,
        "downloadable": True
    }

def search_web_images(query: str) -> dict:
    try:
        encoded = urllib.parse.quote(query)
        resp = req.get(
            f"https://lexica.art/api/v1/search?q={encoded}",
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        if resp.status_code == 200:
            images = resp.json().get("images", [])[:9]
            if images:
                return {
                    "type": "image_search",
                    "images": [{"url": img["src"], "prompt": img.get("prompt", query)[:60]} for img in images],
                    "query": query,
                    "source": "Lexica.art",
                    "count": len(images)
                }
    except Exception:
        pass
    # Fallback to generating
    return generate_ai_image(query)

def detect_task_intent(message: str) -> dict:
    msg = message.lower()

    gen_patterns = [
        r"generate (?:an? )?(?:ai )?(?:image|photo|picture|pic|illustration|artwork|art) (?:of |for |showing )?(.+)",
        r"create (?:an? )?(?:image|photo|picture|illustration|art) (?:of |for |showing )?(.+)",
        r"make (?:an? )?(?:image|photo|picture|illustration) (?:of |for )?(.+)",
        r"draw (?:me )?(?:an? )?(.+)",
        r"ai image (?:of |for )?(.+)",
        r"generate (.+?) image",
        r"show me (?:an? )?(?:image|picture|photo) (?:of )?(.+)",
        r"picture of (.+)",
        r"image of (.+)",
    ]
    for pattern in gen_patterns:
        match = re.search(pattern, msg)
        if match:
            subject = match.group(1).strip().rstrip(".")
            subject = re.sub(r'\b(please|can you|could you|would you|for me|now)\b', '', subject).strip()
            if len(subject) > 2:
                return {"type": "generate_image", "subject": subject, "detected": True}

    search_patterns = [
        r"(?:download|find|search|get|fetch|look for) (?:some |a |an )?(?:good |nice |cool )?(?:image|photo|picture|photos|images|pics) (?:of |for |about )?(.+)",
        r"(?:download|find|search|get) (.+?) (?:image|photo|picture|photos|images|pics)",
    ]
    for pattern in search_patterns:
        match = re.search(pattern, msg)
        if match:
            subject = match.group(1).strip().rstrip(".")
            subject = re.sub(r'\b(please|can you|some|good|nice|cool)\b', '', subject).strip()
            if len(subject) > 2:
                return {"type": "search_image", "subject": subject, "detected": True}

    return {"detected": False}