from langchain_ollama import ChatOllama


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
{portfolio_context}

Latest stored market snapshot:
{market_context}

Latest stored SEC fundamentals:
{sec_context}

Risk drivers:
{risk_drivers}

Evidence:
{evidence}

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

    llm = ChatOllama(
        model="llama3.1:8b",
        temperature=0.2,
    )

    response = llm.invoke(prompt)

    return response.content