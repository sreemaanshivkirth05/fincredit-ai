"""CPU-side checks run before requesting any ZeroGPU time."""
import hmac
import os

MODEL_ID = "Qwen/Qwen3-4B-Instruct-2507"
MAX_PROMPT_CHARS = 24000
MAX_INPUT_TOKENS = 6144
MAX_NEW_TOKENS = 512


def validate_request(prompt, access_key):
    expected = os.environ.get("FINCREDIT_SPACE_KEY", "")
    if len(expected) < 32:
        return "not_configured"
    if not isinstance(access_key, str) or not hmac.compare_digest(access_key.encode(), expected.encode()):
        return "unauthorized"
    if not isinstance(prompt, str) or not prompt.strip() or len(prompt) > MAX_PROMPT_CHARS:
        return "invalid_prompt"
    return None
