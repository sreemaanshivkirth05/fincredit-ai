# Free Hugging Face inference connection

This adds an explicit Hugging Face **Space** client. It never uses paid Inference Providers or Endpoints. Ollama remains the default until cloud mode is configured. Cloud mode sends the research prompt (question, selected evidence and portfolio context) to your Space; the database and application remain local. Do not include personal identifiers or secrets in questions.

## Deploy the Space

Target: https://huggingface.co/spaces/Sreemaan05/fincredit-ai-inference

Upload the four files in `deployment/huggingface-space/` to the **root of the Space repository**: app.py, policy.py, requirements.txt, README.md. Keep Gradio and **ZeroGPU** selected; never choose paid hardware. Qwen/Qwen3-4B-Instruct-2507 is downloaded when the Space starts. The model uses the Apache-2.0 license. Gradio, spaces and torch are provided by the ZeroGPU runtime.

In Space Settings, create the Secret `FINCREDIT_SPACE_KEY` with at least 32 random characters. The same value goes in your local root `.env`. Keep secrets out of source files and chat. Use a password manager to generate the key.

Create a Hugging Face token with the minimum permissions needed to call your Space. Put it only in the backend's `HF_TOKEN` environment variable; do not give it to the frontend. The Gradio client forwards authentication for your ZeroGPU quota. Deployment write permission is separate from runtime inference access.

## Configure FinCredit

In the existing project root `.env` (used by Docker Compose), add:

```dotenv
LLM_PROVIDER=huggingface
HF_SPACE_ID=Sreemaan05/fincredit-ai-inference
HF_TOKEN=your_private_hugging_face_token
FINCREDIT_SPACE_KEY=your_private_random_space_key
HF_TIMEOUT_SECONDS=90
HF_ALLOW_OLLAMA_FALLBACK=false
```

Then run `docker compose up -d --build` from the same project directory to retain the existing database volume. For native backend execution, put these settings in `backend/.env` instead.

To enable local fallback explicitly, set `HF_ALLOW_OLLAMA_FALLBACK=true`, install the selected model in your own Ollama instance, and configure `OLLAMA_BASE_URL` and `OLLAMA_MODEL`. Docker Desktop defaults to `http://host.docker.internal:11434`; native execution defaults to localhost. Cloud is not selected automatically and local fallback is off by default.

## Test

In the Space UI enter the access key and this synthetic prompt:

> Evidence: a simulated position has 2 shares at 100 USD each. Explain its 200 USD value in one sentence. Do not add other facts.

A successful JSON response has `ok: true`, `text`, `model`, `generationSeconds` and `outputTokens`. That duration measures generation, not model startup, queue time or billed GPU quota. Never call these mock tests proof that the deployed model works.

After configuring the backend, ask a similar synthetic question in FinCredit. The audit status should say `Generated with huggingface`. If the percentage reviewer replaces the draft, the audit will report that fallback. Check the Space result separately when diagnosing it.

## Limits and failure behavior

Only one cloud request per backend process; one GPU generation per Space. The client submits once with no automatic retry. It waits up to HF_TIMEOUT_SECONDS for the queued job, with separate 15-second HTTP-operation timeouts during connection setup. Cancellation is best effort; a running GPU operation can continue until its own deadline. The Space requests at most 60 seconds of GPU time, uses a 45-second soft generation limit and a 512-token output cap. Quotas can stop it earlier.

Missing keys, rejected keys, quota exhaustion, unavailable GPUs and invalid responses become sanitized errors. Without explicit local fallback, Ask AI retains its existing calculated answer and reports the failure. Long contexts are rejected, not silently truncated. No billing setting is changed by this code. Free hosting eligibility, quota and platform policies are controlled by Hugging Face.

The Space does not persist prompts or keys in application code, but requests pass through Hugging Face/Gradio infrastructure and are subject to their logging policies. Public source is not private hosting. The shared Space key prevents unauthenticated generation through this app; it does not provide per-user billing or quota isolation for a public multi-user FinCredit deployment.
