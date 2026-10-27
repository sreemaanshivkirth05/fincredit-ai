"""Explicit free/local model routing. Never uses paid inference providers."""
import re
from concurrent.futures import TimeoutError
from threading import BoundedSemaphore
from app.core.config import settings

_REMOTE_SLOT = BoundedSemaphore(1)


class ModelUnavailable(RuntimeError):
    pass


class ModelAnswer(str):
    def __new__(cls, text, provider, model, notice=""):
        value = super().__new__(cls, text)
        value.provider = provider
        value.model = model
        value.notice = notice
        return value


def generate_huggingface(prompt):
    if not re.fullmatch(r"[\w-]+/[\w.-]+", settings.HF_SPACE_ID):
        raise ModelUnavailable("Invalid Hugging Face Space ID")
    key = settings.FINCREDIT_SPACE_KEY.get_secret_value()
    if len(key) < 32 or not settings.HF_TOKEN.get_secret_value():
        raise ModelUnavailable("Hugging Face credentials are not configured")
    if not prompt.strip() or len(prompt) > 24000:
        raise ModelUnavailable("Research context exceeds the cloud request limit; reduce the request")
    if not _REMOTE_SLOT.acquire(blocking=False):
        raise ModelUnavailable("A cloud generation is already in progress; try again after it finishes")
    job = None
    client = None
    try:
        from gradio_client import Client
        client = Client(settings.HF_SPACE_ID, hf_token=settings.HF_TOKEN.get_secret_value(),
                        verbose=False, max_workers=1, analytics_enabled=False, download_files=False,
                        httpx_kwargs={"timeout": 15.0})
        job = client.submit(prompt, key, api_name="/generate")
        result = job.result(timeout=settings.HF_TIMEOUT_SECONDS)
        if not isinstance(result, dict):
            raise ModelUnavailable("Cloud returned an invalid response")
        if not result.get("ok"):
            reasons = {
                "quota_exhausted": "Cloud GPU quota exhausted; no paid service was used",
                "gpu_unavailable": "Cloud GPU unavailable; try again later",
                "unauthorized": "Cloud access key was rejected",
                "not_configured": "Cloud Space secret is not configured",
                "context_too_large": "Research context exceeds the cloud token limit",
                "invalid_prompt": "Cloud prompt validation failed",
                "empty_response": "Cloud model returned no answer",
            }
            raise ModelUnavailable(reasons.get(result.get("error"), "Cloud generation failed"))
        answer = result.get("text")
        if not isinstance(answer, str) or not answer.strip() or len(answer) > 20000:
            raise ModelUnavailable("Cloud returned an invalid answer")
        notice = "Output reached its token limit; review for incompleteness" if result.get("possiblyTruncated") else ""
        return ModelAnswer(answer, "huggingface", "Qwen/Qwen3-4B-Instruct-2507", notice)
    except ModelUnavailable:
        raise
    except TimeoutError:
        raise ModelUnavailable("Cloud queue or generation timed out; no automatic retry was submitted") from None
    except Exception as error:
        # Provider errors can contain credentials or prompt content. Never expose them.
        message = str(error).lower()
        reason = "Cloud GPU quota exhausted; no paid service was used" if "quota" in message else "Cloud connection failed or Space is not ready"
        raise ModelUnavailable(reason) from None
    finally:
        if job is not None:
            try:
                job.cancel()
            except Exception:
                pass
        if client is not None:
            try:
                client.close()
            except Exception:
                pass
        _REMOTE_SLOT.release()


def generate_local(prompt):
    from ollama import Client, ResponseError
    from httpx import TimeoutException
    try:
        client = Client(host=settings.OLLAMA_BASE_URL, timeout=settings.LLM_TIMEOUT_SECONDS)
        response = client.chat(model=settings.OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.2, "num_ctx": 8192,
                     "num_predict": settings.OLLAMA_MAX_OUTPUT_TOKENS})
        answer = response.message.content
        if not isinstance(answer, str) or not answer.strip():
            raise ModelUnavailable("Local model returned no answer")
        notice = "Output reached its token limit; review for incompleteness" if response.done_reason == "length" else ""
        return ModelAnswer(answer, "ollama", settings.OLLAMA_MODEL, notice)
    except ModelUnavailable:
        raise
    except ResponseError as error:
        reason = "Configured Ollama model is not installed" if error.status_code == 404 else "Local Ollama rejected generation"
        raise ModelUnavailable(reason) from None
    except TimeoutException:
        raise ModelUnavailable(f"Local Ollama timed out after {settings.LLM_TIMEOUT_SECONDS} seconds") from None
    except Exception:
        raise ModelUnavailable("Local Ollama is unavailable or timed out") from None


def generate_model_answer(prompt):
    if settings.LLM_PROVIDER == "huggingface":
        try:
            return generate_huggingface(prompt)
        except ModelUnavailable as error:
            if not settings.HF_ALLOW_OLLAMA_FALLBACK:
                raise
            result = generate_local(prompt)
            result.notice = f"Cloud unavailable ({error}); used local Ollama"
            return result
    return generate_local(prompt)
