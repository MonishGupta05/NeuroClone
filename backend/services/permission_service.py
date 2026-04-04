ALLOWED_ACTIONS = []

def request_permission(action: str, description: str) -> dict:
    return {
        "action": action,
        "description": description,
        "status": "pending",
        "message": f"Monish, should I go ahead and {description}? Reply yes or no."
    }

def grant_permission(action: str) -> dict:
    ALLOWED_ACTIONS.append(action)
    return {"action": action, "status": "granted"}

def deny_permission(action: str) -> dict:
    return {"action": action, "status": "denied"}

def execute_if_allowed(action: str) -> dict:
    if action in ALLOWED_ACTIONS:
        ALLOWED_ACTIONS.remove(action)
        return {"action": action, "status": "executed"}
    return {"action": action, "status": "not_allowed", "message": "Permission not granted yet."}