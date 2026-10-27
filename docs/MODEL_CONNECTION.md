# Local model connection

Selected provider: **Ollama**, model **`llama3.1:8b`**, using the existing installed Q4_K_M model. It was not downloaded by this work. Backend and Committee worker use the same Docker Compose environment anchor, so both must be recreated when routing changes.

## Diagnosis on 2026-10-27

Both containers reached `http://host.docker.internal:11434` and Ollama version `0.40.11`. Installed entries were:

| Entry | Type | Decision |
| --- | --- | --- |
| `llama3.1:8b` | Local, 8B, Q4_K_M, roughly 4.9 GB model file | Selected and verified with actual generation |
| `minimax-m2.5:cloud` | Cloud model reference, not local weights | Not selected; cloud costs/eligibility were not assessed or enabled |

The former configured `qwen3:1.7b` was absent. Both services selected it and had a 20-second local timeout. The Committee worker also still used an older image than the API. The fix rebuilt/recreated both services using the seed-free local override, without replacing frontend/PostgreSQL or resetting any database records.

The first short local Llama check spent approximately 16 seconds loading the model. A real, longer adapter response took approximately 58 seconds. The 20-second limit was unsuitable for this CPU setup even after choosing an installed model. Runtime inspection showed zero GPU memory usage for this model; CPU inference can be slow.

Local settings are stored in ignored root `.env`:

```dotenv
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1:8b
LLM_TIMEOUT_SECONDS=180
OLLAMA_MAX_OUTPUT_TOKENS=384
HF_ALLOW_OLLAMA_FALLBACK=false
SIMULATION_ENABLED=false
```

No credentials were written to this file. [.env.example](../.env.example) is the shareable template. Do not overwrite an existing `.env` containing your private settings merely to follow this guide.

## Provider behavior and local changes

Ask AI and Committee share `app.services.model_provider.generate_model_answer`. Only Ollama and the existing Hugging Face Space adapter are supported. There is no automatic paid-provider route.

- Compose now forwards `LLM_TIMEOUT_SECONDS` instead of hardcoding 20. The default remains 20 for environments without a local override.
- `OLLAMA_MAX_OUTPUT_TOKENS` is validated between 64 and 2,048 and defaults to the previous 768. This machine's override is 384. The existing 8,192-token context setting is unchanged.
- A response ending because of its token limit now carries an explicit incompleteness notice. It is still model-generated; inspect it before relying on a truncated argument. Ask audit status and Committee perspective notices retain the warning.
- Missing installed model, provider rejection, and timeout now have distinct sanitized errors. Effective timeout appears in errors; the old hardcoded 20-second audit branch was removed.
- Deterministic fallback and percentage-review replacement remain enabled as before. A direct model success does not guarantee that the final Ask answer passes the existing review.

## Apply and verify locally

From the actual repository root in PowerShell:

```powershell
docker compose -f docker-compose.yml -f compose.simulation-local.yml up -d --no-deps --build backend committee-worker
docker compose ps
```

The override prepares additive schemas without demo seeding/reset. Do not run it while an existing Committee job is active. No model pull command is needed for the already-installed selected model. Restart Ollama yourself if it is stopped; Docker does not host it.

Repeat the direct/container and existing-workflow checks with isolated fresh test records:

```powershell
python scripts/verify_model_connection.py
```

To also rebuild/recreate the backend and worker first, add `--restart-services`. The helper prints only safe configuration/provenance and synthetic-result metadata; it does not print credentials or full research responses. It retains test records and compares all pre-existing database rows for changes. Results are saved in `docs/MODEL_CONNECTION_LIVE_RESULTS.json`.

This helper does not invoke Simulation Lab execution, enable Phase 2, pull models, or change HF hosting. Its new account has no holdings, so it exercises source-gap handling without sending personal portfolio data anywhere. Coordinate verification with other local users so concurrent edits do not invalidate preservation comparisons.

## Hugging Face: configured target is currently unavailable

Target: [Sreemaan05/fincredit-ai-inference](https://huggingface.co/spaces/Sreemaan05/fincredit-ai-inference).

The Hub returned a public Gradio repository in **`NO_APP_FILE`** state. Its repository tree contained only `.gitattributes` and `README.md`, not an inference app. Runtime hardware was absent; requested hardware was `zero-a10g`. A requested hardware value is not proof of a working allocation or usable quota.

Live `/config` and `/gradio_api/info` requests returned **503**. A synthetic POST to `/gradio_api/call/generate` also returned **503**, with no accepted generation. The worker independently received 503 for API info. Therefore the deployed API contract and actual HF generation could not be validated. Neither container had an HF token or matching application Space key configured.

The **intended repository contract**, documented by the existing local source in `deployment/huggingface-space`, is:

- Named Gradio endpoint `/generate`, two string inputs: prompt and access key.
- JSON object output: `ok`, `text`, `model`, generation time, output token count and truncation flag on success; sanitized error code on failure.
- Server Space secret `FINCREDIT_SPACE_KEY` must contain at least 32 characters; missing/mismatched keys fail closed before GPU allocation.
- The local adapter additionally requires `HF_TOKEN` and the same `FINCREDIT_SPACE_KEY` and submits `client.submit(prompt, key, api_name="/generate")` using authenticated HF quota. This application authentication is separate from public readability of the repository.
- Expected model: `Qwen/Qwen3-4B-Instruct-2507`. This is an intended identifier from local source, not an observed remote loaded model.

Restoring HF would require deploying the missing app files, supplying secrets privately, confirming an eligible free runtime/quota, and then testing real generation. None of those remote changes were performed. The existing HF setup guide describes them, but they are optional and outside this local repair. Do not select paid hardware or assume authenticated HF has unlimited free quota.

## Interpreting verification

Latest live results: [machine-readable report](MODEL_CONNECTION_LIVE_RESULTS.json).

| Check | Actual result |
| --- | --- |
| Backend direct provider adapter | Generated exact synthetic response; 8.31 seconds after recreation |
| Committee worker direct adapter | Generated exact synthetic response; 1.08 seconds |
| Ask AI | `Generated with ollama: llama3.1:8b`; retained generated answer, no fallback; 53.11 seconds |
| Investment Committee | `completed`, two generated Llama perspectives, no truncation notices; 49.72 seconds |
| Committee evidence audit | Bull passed the limited checks; bear had a missing-citations flag. No unknown evidence references or percentage findings. Completion is not a factual-quality certification |
| Existing data | All 39 pre-existing rows were compared before/after rebuilding and workflow checks; zero changed or missing rows |
| Regression suite | 55 passed; three opt-in PostgreSQL checks skipped. These are mocked/isolated tests, separate from the actual inference results above |
| Static/configuration checks | Python compilation, Compose validation and Git whitespace checks passed |

One fresh isolated account, one Ask record and one Committee packet were retained. Credentials remained transient and were not printed or saved. Simulation Lab stayed disabled throughout; no Phase 2 work was added. Four Docker services are running; frontend and PostgreSQL were not recreated.

- Direct `model_generated` means the real provider adapter returned nonempty model text, not a deterministic fallback.
- Ask audit `Generated with ollama: llama3.1:8b` means the displayed response retained model generation. `Fallback...` or `Deterministic fallback after percentage review flags` means the displayed answer is deterministic.
- Committee `completed` with two `generated` perspectives confirms both model calls returned. `partial` and `unavailable` perspectives do not. Citation/percentage audit flags can still occur in a completed packet and do not verify source truth.

Browser visual checks remain manual: Settings should show Ollama/Llama routing, Ask audit should show the actual provenance, and Advanced Committee Debate should show provider/model and any incompleteness notice. Existing saved fallback/partial runs remain unchanged; create a fresh request to test the repaired connection.

Remaining issues: HF is unavailable/unconfigured as described above; CPU latency is substantial; generated arguments can omit citations and still require review. Larger real portfolios and concurrent Ask/Committee generations were not load-tested. The service log also contains the existing Passlib/bcrypt version-detection warning during registration; login/registration succeeded, and no service ERROR-level entries accompanied the verification. No unrelated dependency upgrade was made for that warning.
