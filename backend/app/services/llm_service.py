from concurrent.futures import ThreadPoolExecutor, TimeoutError

from langchain_ollama import ChatOllama


LLM_TIMEOUT_SECONDS = 20
MAX_CONTEXT_ITEMS = 6


def limit_context_items(items):
    if isinstance(items, list):
        return items[:MAX_CONTEXT_ITEMS]

    return items


def build_fincredit_prompt(
    question: str,
    ticker: str | None,
    portfolio_context: list[dict],
    market_context: dict | None,
    sec_context: dict | None,
    risk_drivers: list[dict],
    evidence: list[dict],
) -> str:
    return f"""
You are FinCredit AI, a financial intelligence assistant.

Use only the structured evidence provided below.
Do not invent numbers, filings, ratios, or sources.
If a value is missing, clearly say it is not available.
Write in a professional analyst style.

User question:
{question}

Detected ticker:
{ticker}

Portfolio context:
{limit_context_items(portfolio_context)}

Latest stored market snapshot:
{market_context}

Latest stored SEC fundamentals:
{sec_context}

Risk drivers:
{limit_context_items(risk_drivers)}

Evidence:
{limit_context_items(evidence)}

Write your answer in clean Markdown with clear spacing.

Use this exact structure:

**Direct Answer:**

One short paragraph answering the question directly.

**Main Risk Drivers:**

1. First risk driver.
2. Second risk driver.
3. Third risk driver, if available.

**Market and SEC Evidence Used:**

1. Market evidence used.
2. SEC fundamentals evidence used.
3. Portfolio evidence used, if relevant.

**Short Analyst Recommendation:**

One short recommendation paragraph.

Important formatting rules:
- Add a blank line after every section heading.
- Do not put the entire answer in one paragraph.
- Do not invent values not present in the evidence.
- Do not give investment advice. Frame recommendations as analyst review actions.
"""


def generate_llm_answer(
    question: str,
    ticker: str | None,
    portfolio_context: list[dict],
    market_context: dict | None,
    sec_context: dict | None,
    risk_drivers: list[dict],
    evidence: list[dict],
) -> str:
    prompt = build_fincredit_prompt(
        question=question,
        ticker=ticker,
        portfolio_context=portfolio_context,
        market_context=market_context,
        sec_context=sec_context,
        risk_drivers=risk_drivers,
        evidence=evidence,
    )

    def invoke_llm():
        llm = ChatOllama(
            model="llama3.1:8b",
            temperature=0.2,
        )

        return llm.invoke(prompt)

    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(invoke_llm)

    try:
        response = future.result(timeout=LLM_TIMEOUT_SECONDS)
    except TimeoutError as error:
        future.cancel()
        executor.shutdown(wait=False, cancel_futures=True)
        raise RuntimeError(
            f"Local LLM timed out after {LLM_TIMEOUT_SECONDS} seconds"
        ) from error
    except Exception:
        executor.shutdown(wait=False, cancel_futures=True)
        raise
    else:
        executor.shutdown(wait=False)

    return response.content
