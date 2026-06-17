from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/company", tags=["Company"])


COMPANIES = {
    "MSFT": {
        "ticker": "MSFT",
        "company": "Microsoft Corp.",
        "sector": "Technology",
        "risk": "Low",
        "riskScore": 28,
        "sentiment": "Positive",
        "summary": "Microsoft shows strong cloud and AI-driven revenue momentum, stable profitability, and low credit risk. Regulatory language has increased slightly, but financial strength remains high.",
        "marketCap": "$3.2T",
        "revenue": "$245B",
        "debtToEquity": "0.32",
        "profitMargin": "36.4%",
        "groundingScore": 94,
        "unsupportedClaims": 0,
        "riskTrend": [
            {"month": "Jan", "risk": 24},
            {"month": "Feb", "risk": 25},
            {"month": "Mar", "risk": 27},
            {"month": "Apr", "risk": 29},
            {"month": "May", "risk": 27},
            {"month": "Jun", "risk": 28},
        ],
        "redFlags": [
            {
                "title": "Regulatory language expanded",
                "severity": "Medium",
                "detail": "Latest filing includes expanded discussion around AI regulation and cloud competition.",
            },
            {
                "title": "Cloud growth dependence",
                "severity": "Low",
                "detail": "Revenue outlook remains partially dependent on Azure and enterprise AI demand.",
            },
        ],
        "filingSignals": [
            {
                "section": "Risk Factors",
                "signal": "AI and cloud regulatory exposure mentioned more frequently.",
                "change": "Expanded",
            },
            {
                "section": "Management Discussion",
                "signal": "Cloud and productivity segment strength remains consistent.",
                "change": "Stable",
            },
        ],
        "peerBenchmark": [
            {"company": "MSFT", "risk": 28, "profitability": 92},
            {"company": "AAPL", "risk": 49, "profitability": 87},
            {"company": "GOOGL", "risk": 37, "profitability": 84},
        ],
        "evidence": [
            {
                "source": "SEC 10-K",
                "claim": "Microsoft maintains strong profitability and low leverage.",
                "confidence": 96,
            },
            {
                "source": "Company Facts",
                "claim": "Revenue and operating income remain stable.",
                "confidence": 94,
            },
        ],
    },
    "TSLA": {
        "ticker": "TSLA",
        "company": "Tesla Inc.",
        "sector": "Automotive",
        "risk": "High",
        "riskScore": 78,
        "sentiment": "Mixed",
        "summary": "Tesla has elevated risk due to margin pressure, demand uncertainty, executive dependency, and negative sentiment spikes. Growth remains strong but volatility is materially higher than peers.",
        "marketCap": "$580B",
        "revenue": "$97B",
        "debtToEquity": "0.18",
        "profitMargin": "8.2%",
        "groundingScore": 87,
        "unsupportedClaims": 2,
        "riskTrend": [
            {"month": "Jan", "risk": 55},
            {"month": "Feb", "risk": 59},
            {"month": "Mar", "risk": 63},
            {"month": "Apr", "risk": 71},
            {"month": "May", "risk": 74},
            {"month": "Jun", "risk": 78},
        ],
        "redFlags": [
            {
                "title": "Margin pressure detected",
                "severity": "High",
                "detail": "Operating margin pressure increased compared with prior reporting periods.",
            },
            {
                "title": "Negative sentiment spike",
                "severity": "High",
                "detail": "Recent news coverage shows increased negative sentiment around demand and competition.",
            },
            {
                "title": "Filing risk language changed",
                "severity": "Medium",
                "detail": "Latest 10-Q includes expanded language around competition and market uncertainty.",
            },
        ],
        "filingSignals": [
            {
                "section": "Risk Factors",
                "signal": "Competition and pricing pressure language increased.",
                "change": "Expanded",
            },
            {
                "section": "Management Discussion",
                "signal": "Margin and demand commentary became more cautious.",
                "change": "Changed",
            },
        ],
        "peerBenchmark": [
            {"company": "TSLA", "risk": 78, "profitability": 62},
            {"company": "GM", "risk": 58, "profitability": 55},
            {"company": "F", "risk": 64, "profitability": 49},
        ],
        "evidence": [
            {
                "source": "SEC 10-Q",
                "claim": "Risk language expanded around pricing and demand uncertainty.",
                "confidence": 86,
            },
            {
                "source": "News Radar",
                "claim": "Sentiment became more mixed over the last 30 days.",
                "confidence": 82,
            },
        ],
    },
    "NVDA": {
        "ticker": "NVDA",
        "company": "NVIDIA Corp.",
        "sector": "Semiconductors",
        "risk": "Medium",
        "riskScore": 54,
        "sentiment": "Positive",
        "summary": "NVIDIA shows strong AI infrastructure demand and high profitability, but valuation concentration, supply-chain exposure, and customer concentration keep risk at a medium level.",
        "marketCap": "$3.0T",
        "revenue": "$115B",
        "debtToEquity": "0.20",
        "profitMargin": "49.1%",
        "groundingScore": 91,
        "unsupportedClaims": 1,
        "riskTrend": [
            {"month": "Jan", "risk": 44},
            {"month": "Feb", "risk": 47},
            {"month": "Mar", "risk": 50},
            {"month": "Apr", "risk": 56},
            {"month": "May", "risk": 53},
            {"month": "Jun", "risk": 54},
        ],
        "redFlags": [
            {
                "title": "Valuation concentration",
                "severity": "Medium",
                "detail": "Market expectations remain high due to AI demand assumptions.",
            },
            {
                "title": "Supply-chain exposure",
                "severity": "Medium",
                "detail": "Semiconductor production depends on specialized suppliers and capacity.",
            },
        ],
        "filingSignals": [
            {
                "section": "Risk Factors",
                "signal": "Supply-chain and customer concentration language remains material.",
                "change": "Stable",
            },
            {
                "section": "Business Overview",
                "signal": "AI data center demand remains a primary growth driver.",
                "change": "Expanded",
            },
        ],
        "peerBenchmark": [
            {"company": "NVDA", "risk": 54, "profitability": 95},
            {"company": "AMD", "risk": 57, "profitability": 72},
            {"company": "INTC", "risk": 69, "profitability": 51},
        ],
        "evidence": [
            {
                "source": "SEC 10-K",
                "claim": "AI data center demand remains a major revenue driver.",
                "confidence": 91,
            },
            {
                "source": "Company Facts",
                "claim": "Profitability remains above semiconductor peers.",
                "confidence": 93,
            },
        ],
    },
    "JPM": {
        "ticker": "JPM",
        "company": "JPMorgan Chase",
        "sector": "Financials",
        "risk": "Low",
        "riskScore": 33,
        "sentiment": "Neutral",
        "summary": "JPMorgan Chase maintains strong capital position, diversified revenue, and comparatively low credit risk. Interest-rate sensitivity and credit-loss monitoring remain key watch areas.",
        "marketCap": "$575B",
        "revenue": "$162B",
        "debtToEquity": "1.23",
        "profitMargin": "29.8%",
        "groundingScore": 96,
        "unsupportedClaims": 0,
        "riskTrend": [
            {"month": "Jan", "risk": 31},
            {"month": "Feb", "risk": 32},
            {"month": "Mar", "risk": 35},
            {"month": "Apr", "risk": 34},
            {"month": "May", "risk": 32},
            {"month": "Jun", "risk": 33},
        ],
        "redFlags": [
            {
                "title": "Credit loss monitoring",
                "severity": "Low",
                "detail": "Credit provisions should be monitored under macroeconomic stress scenarios.",
            },
            {
                "title": "Interest-rate sensitivity",
                "severity": "Medium",
                "detail": "Net interest income remains sensitive to rate changes.",
            },
        ],
        "filingSignals": [
            {
                "section": "Risk Management",
                "signal": "Capital and credit risk controls remain stable.",
                "change": "Stable",
            },
            {
                "section": "Management Discussion",
                "signal": "Interest-rate sensitivity remains a key driver.",
                "change": "Stable",
            },
        ],
        "peerBenchmark": [
            {"company": "JPM", "risk": 33, "profitability": 82},
            {"company": "BAC", "risk": 48, "profitability": 69},
            {"company": "C", "risk": 57, "profitability": 61},
        ],
        "evidence": [
            {
                "source": "SEC 10-K",
                "claim": "Capital position and risk controls remain stable.",
                "confidence": 96,
            },
            {
                "source": "Company Facts",
                "claim": "Profitability remains strong versus banking peers.",
                "confidence": 94,
            },
        ],
    },
    "AAPL": {
        "ticker": "AAPL",
        "company": "Apple Inc.",
        "sector": "Technology",
        "risk": "Medium",
        "riskScore": 49,
        "sentiment": "Neutral",
        "summary": "Apple remains financially strong with high profitability and brand strength, but revenue concentration, China exposure, and product-cycle dependency keep risk at a medium level.",
        "marketCap": "$3.1T",
        "revenue": "$391B",
        "debtToEquity": "1.45",
        "profitMargin": "26.3%",
        "groundingScore": 90,
        "unsupportedClaims": 1,
        "riskTrend": [
            {"month": "Jan", "risk": 42},
            {"month": "Feb", "risk": 44},
            {"month": "Mar", "risk": 47},
            {"month": "Apr", "risk": 51},
            {"month": "May", "risk": 48},
            {"month": "Jun", "risk": 49},
        ],
        "redFlags": [
            {
                "title": "Revenue concentration",
                "severity": "Medium",
                "detail": "iPhone revenue concentration remains a material business dependency.",
            },
            {
                "title": "Geographic exposure",
                "severity": "Medium",
                "detail": "China-related supply chain and demand risks remain important.",
            },
        ],
        "filingSignals": [
            {
                "section": "Risk Factors",
                "signal": "Supply chain and geographic risk language remains material.",
                "change": "Stable",
            },
            {
                "section": "Business Overview",
                "signal": "Product-cycle dependency continues to influence growth expectations.",
                "change": "Stable",
            },
        ],
        "peerBenchmark": [
            {"company": "AAPL", "risk": 49, "profitability": 87},
            {"company": "MSFT", "risk": 28, "profitability": 92},
            {"company": "GOOGL", "risk": 37, "profitability": 84},
        ],
        "evidence": [
            {
                "source": "SEC 10-K",
                "claim": "Product concentration and geographic exposure remain relevant risks.",
                "confidence": 89,
            },
            {
                "source": "Company Facts",
                "claim": "Profitability remains high relative to large-cap technology peers.",
                "confidence": 91,
            },
        ],
    },
}


@router.get("/{ticker}")
def get_company(ticker: str):
    ticker_upper = ticker.upper()

    if ticker_upper not in COMPANIES:
        raise HTTPException(status_code=404, detail="Company not found")

    company = COMPANIES[ticker_upper]

    return {
        **company,
        "message": f"{ticker_upper} company API connected successfully",
    }