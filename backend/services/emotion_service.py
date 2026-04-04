def detect_emotion(message: str) -> dict:
    msg = message.lower()

    tired_keywords = ["tired", "thaka", "neend", "sleep", "exhausted", "bore", "bored", "nahi ho rha", "nahi kar pa rha", "bas nahi"]
    frustrated_keywords = ["frustrated", "angry", "gussa", "irritated", "kuch nahi ho rha", "sab bekaar", "pointless", "why am i", "what's the point", "I hate"]
    anxious_keywords = ["scared", "dar", "nervous", "anxious", "worried", "tension", "stress", "panic", "overwhelmed", "bahut zyada"]
    motivated_keywords = ["let's go", "ready", "motivated", "pumped", "excited", "start", "shuru", "focus", "grind", "haan bhai", "let's start"]
    sad_keywords = ["sad", "dukhi", "crying", "cry", "hurt", "heartbreak", "broken", "feel bad", "feel empty", "alone", "lonely"]
    confused_keywords = ["confused", "samajh nahi", "don't understand", "what to do", "kya karu", "lost", "no direction", "clueless"]

    scores = {
        "tired": sum(1 for k in tired_keywords if k in msg),
        "frustrated": sum(1 for k in frustrated_keywords if k in msg),
        "anxious": sum(1 for k in anxious_keywords if k in msg),
        "motivated": sum(1 for k in motivated_keywords if k in msg),
        "sad": sum(1 for k in sad_keywords if k in msg),
        "confused": sum(1 for k in confused_keywords if k in msg),
    }

    dominant = max(scores, key=scores.get)
    if scores[dominant] == 0:
        dominant = "neutral"

    tone_map = {
        "tired": "He seems tired or low energy. Be gentle but still push him lightly. Don't lecture. Short response.",
        "frustrated": "He's frustrated. Acknowledge it first. Don't immediately give advice. Validate then redirect.",
        "anxious": "He's anxious or stressed. Be calm. Break things into small steps. Make it feel manageable.",
        "motivated": "He's pumped and ready. Match his energy. Be direct, sharp, get him moving immediately.",
        "sad": "He's emotionally low. This is rare for him. Be human first. Don't give productivity advice yet.",
        "confused": "He's lost on direction. Give him clarity. One clear path, not ten options.",
        "neutral": "Normal state. Be direct, honest, and sharp as usual.",
    }

    return {
        "emotion": dominant,
        "tone_instruction": tone_map[dominant],
        "confidence": scores.get(dominant, 0)
    }