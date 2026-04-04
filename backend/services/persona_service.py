from prompts import MONISH_SYSTEM_PROMPT

def build_system_prompt(memory_context: str = "", current_context: str = ""):
    return MONISH_SYSTEM_PROMPT.format(
        memory_context=memory_context if memory_context else "No specific memories yet.",
        current_context=current_context if current_context else "General conversation."
    )