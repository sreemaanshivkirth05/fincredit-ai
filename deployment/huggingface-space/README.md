---
title: FinCredit AI Inference
emoji: 📊
colorFrom: gray
colorTo: blue
sdk: gradio
sdk_version: 5.49.1
app_file: app.py
pinned: false
---

Bounded inference using Qwen/Qwen3-4B-Instruct-2507 (Apache-2.0 model license).
Select **ZeroGPU** hardware. Do not select paid hardware.

Add a Space Secret named `FINCREDIT_SPACE_KEY`, using a randomly generated string of at least 32 characters. Requests fail closed until configured. Never put this secret in source files. Gradio, spaces and torch are managed by the ZeroGPU runtime; they are deliberately omitted from requirements.txt.

The `/generate` endpoint accepts `prompt` and `access_key`, returning a JSON object. Validation runs before GPU allocation. Maximum: 24,000 prompt characters, 6,144 input tokens, 512 generated tokens, one generation at a time. GPU allocation is capped at 60 seconds; generation has a 45-second soft limit. Providers can impose tighter quotas. No automatic retries, paid inference, model-generated tool execution, or trading access.

Application code does not persist prompts or keys. Hugging Face/Gradio still process requests and may retain service logs under their policies. The public repository contains code, not backend database credentials. The client should pass its Hugging Face token privately to receive its authenticated ZeroGPU quota.
