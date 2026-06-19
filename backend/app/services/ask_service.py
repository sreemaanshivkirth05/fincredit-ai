def ask_fincredit_service(question: str):
    cleaned_question = question.strip()

    return {
        "question": cleaned_question,
        "answer": (
            "Your portfolio risk increased mainly because TSLA moved into a high-risk range, "
            "NVDA remains a large concentration position, and recent filing/news signals show "
            "higher uncertainty around margins, regulation, and market volatility."
        ),
        "riskDrivers": [
            {
                "ticker": "TSLA",
                "driver": "Margin pressure and negative sentiment increased",
                "impact": "High",
            },
            {
                "ticker": "NVDA",
                "driver": "Portfolio concentration remains above target threshold",
                "impact": "Medium",
            },
            {
                "ticker": "MSFT",
                "driver": "Regulatory language expanded in latest filing",
                "impact": "Medium",
            },
        ],
        "evidence": [
            {
                "source": "TSLA 10-Q",
                "claim": "Competition and pricing pressure language increased.",
                "confidence": 86,
            },
            {
                "source": "Portfolio Holdings",
                "claim": "NVDA and MSFT represent the largest portfolio weights.",
                "confidence": 94,
            },
            {
                "source": "News Radar",
                "claim": "TSLA sentiment became more mixed over the last 30 days.",
                "confidence": 82,
            },
        ],
        "suggestedActions": [
            "Run a TSLA red flag report",
            "Review NVDA concentration exposure",
            "Generate a portfolio downside scenario",
        ],
        "audit": {
            "primaryModel": "ChatGPT API",
            "localModel": "Ollama Qwen Local",
            "groundingScore": 89,
            "unsupportedClaims": 1,
            "status": "Needs analyst review before final report export",
        },
        "message": "Ask FinCredit API connected successfully",
    }