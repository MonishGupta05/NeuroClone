from groq import Groq
from config import GROQ_API_KEY, MODEL_NAME
from services.persona_service import build_system_prompt
from services.emotion_service import detect_emotion

client = Groq(api_key=GROQ_API_KEY)

def get_response(user_message: str, memory_context: str = "", current_context: str = "") -> str:
    emotion_data = detect_emotion(user_message)
    
    emotion_context = f"""
Current emotional state detected: {emotion_data['emotion']}
Tone instruction: {emotion_data['tone_instruction']}
"""
    
    full_context = f"{current_context}\n{emotion_context}".strip()
    system_prompt = build_system_prompt(memory_context, full_context)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.85,
        max_tokens=1024
    )
    return response.choices[0].message.content