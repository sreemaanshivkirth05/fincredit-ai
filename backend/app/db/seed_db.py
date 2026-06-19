from app.db.database import SessionLocal
from app.models.holding import Holding
from app.models.watchlist_company import WatchlistCompany
from app.models.report import Report
from app.models.company_profile import CompanyProfile
from app.models.audit_log import AuditLog


def seed_holdings(db):
    existing_count = db.query(Holding).count()

    if existing_count > 0:
        print("Holdings already exist. Skipping holdings seed.")
        return

    holdings = [
        Holding(
            ticker="MSFT",
            company="Microsoft Corp.",
            shares=5,
            avg_price=410,
            value=2245,
            weight=34,
            sector="Technology",
            risk="Low",
            score=28,
            sentiment="Positive",
        ),
        Holding(
            ticker="NVDA",
            company="NVIDIA Corp.",
            shares=3,
            avg_price=125,
            value=2130,
            weight=31,
            sector="Semiconductors",
            risk="Medium",
            score=54,
            sentiment="Positive",
        ),
        Holding(
            ticker="TSLA",
            company="Tesla Inc.",
            shares=2,
            avg_price=220,
            value=1430,
            weight=21,
            sector="Automotive",
            risk="High",
            score=78,
            sentiment="Mixed",
        ),
        Holding(
            ticker="JPM",
            company="JPMorgan Chase",
            shares=4,
            avg_price=190,
            value=960,
            weight=14,
            sector="Financials",
            risk="Low",
            score=33,
            sentiment="Neutral",
        ),
    ]

    db.add_all(holdings)
    db.commit()
    print("Holdings seeded successfully.")


def seed_watchlist(db):
    existing_count = db.query(WatchlistCompany).count()

    if existing_count > 0:
        print("Watchlist companies already exist. Skipping watchlist seed.")
        return

    watchlist = [
        WatchlistCompany(
            ticker="MSFT",
            company="Microsoft Corp.",
            sector="Technology",
            risk="Low",
            risk_score=28,
            sentiment="Positive",
            filing="10-K analyzed",
            status="Stable",
        ),
        WatchlistCompany(
            ticker="NVDA",
            company="NVIDIA Corp.",
            sector="Semiconductors",
            risk="Medium",
            risk_score=54,
            sentiment="Positive",
            filing="No new filing",
            status="Monitor",
        ),
        WatchlistCompany(
            ticker="TSLA",
            company="Tesla Inc.",
            sector="Automotive",
            risk="High",
            risk_score=78,
            sentiment="Mixed",
            filing="10-Q changed",
            status="Needs Review",
        ),
        WatchlistCompany(
            ticker="JPM",
            company="JPMorgan Chase",
            sector="Financials",
            risk="Low",
            risk_score=33,
            sentiment="Neutral",
            filing="10-K analyzed",
            status="Stable",
        ),
        WatchlistCompany(
            ticker="AAPL",
            company="Apple Inc.",
            sector="Technology",
            risk="Medium",
            risk_score=49,
            sentiment="Neutral",
            filing="No new filing",
            status="Monitor",
        ),
    ]

    db.add_all(watchlist)
    db.commit()
    print("Watchlist companies seeded successfully.")


def seed_reports(db):
    existing_count = db.query(Report).count()

    if existing_count > 0:
        print("Reports already exist. Skipping reports seed.")
        return

    reports = [
        Report(
            report_id="RPT-1042",
            company="Microsoft",
            ticker="MSFT",
            report_type="Credit Risk + Filing Analysis",
            status="Approved",
            grounding=94,
            unsupported=0,
            model="ChatGPT API",
            created="Jun 15, 2026",
        ),
        Report(
            report_id="RPT-1041",
            company="Tesla",
            ticker="TSLA",
            report_type="Red Flag Review",
            status="Needs Review",
            grounding=87,
            unsupported=2,
            model="ChatGPT API + Ollama",
            created="Jun 14, 2026",
        ),
        Report(
            report_id="RPT-1040",
            company="NVIDIA",
            ticker="NVDA",
            report_type="Peer Benchmark",
            status="Draft",
            grounding=91,
            unsupported=1,
            model="ChatGPT API",
            created="Jun 13, 2026",
        ),
        Report(
            report_id="RPT-1039",
            company="JPMorgan Chase",
            ticker="JPM",
            report_type="Portfolio Impact Memo",
            status="Approved",
            grounding=96,
            unsupported=0,
            model="ChatGPT API + Ollama",
            created="Jun 12, 2026",
        ),
    ]

    db.add_all(reports)
    db.commit()
    print("Reports seeded successfully.")

def seed_company_profiles(db):
    existing_count = db.query(CompanyProfile).count()

    if existing_count > 0:
        print("Company profiles already exist. Skipping company profile seed.")
        return

    companies = [
        CompanyProfile(
            ticker="MSFT",
            company="Microsoft Corp.",
            sector="Technology",
            risk="Low",
            risk_score=28,
            sentiment="Positive",
            summary="Microsoft shows strong cloud and AI-driven revenue momentum, stable profitability, and low credit risk. Regulatory language has increased slightly, but financial strength remains high.",
            market_cap="$3.2T",
            revenue="$245B",
            debt_to_equity="0.32",
            profit_margin="36.4%",
            grounding_score=94,
            unsupported_claims=0,
            risk_trend=[
                {"month": "Jan", "risk": 24},
                {"month": "Feb", "risk": 25},
                {"month": "Mar", "risk": 27},
                {"month": "Apr", "risk": 29},
                {"month": "May", "risk": 27},
                {"month": "Jun", "risk": 28},
            ],
            red_flags=[
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
            filing_signals=[
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
            peer_benchmark=[
                {"company": "MSFT", "risk": 28, "profitability": 92},
                {"company": "AAPL", "risk": 49, "profitability": 87},
                {"company": "GOOGL", "risk": 37, "profitability": 84},
            ],
            evidence=[
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
        ),
        CompanyProfile(
            ticker="TSLA",
            company="Tesla Inc.",
            sector="Automotive",
            risk="High",
            risk_score=78,
            sentiment="Mixed",
            summary="Tesla has elevated risk due to margin pressure, demand uncertainty, executive dependency, and negative sentiment spikes. Growth remains strong but volatility is materially higher than peers.",
            market_cap="$580B",
            revenue="$97B",
            debt_to_equity="0.18",
            profit_margin="8.2%",
            grounding_score=87,
            unsupported_claims=2,
            risk_trend=[
                {"month": "Jan", "risk": 55},
                {"month": "Feb", "risk": 59},
                {"month": "Mar", "risk": 63},
                {"month": "Apr", "risk": 71},
                {"month": "May", "risk": 74},
                {"month": "Jun", "risk": 78},
            ],
            red_flags=[
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
            filing_signals=[
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
            peer_benchmark=[
                {"company": "TSLA", "risk": 78, "profitability": 62},
                {"company": "GM", "risk": 58, "profitability": 55},
                {"company": "F", "risk": 64, "profitability": 49},
            ],
            evidence=[
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
        ),
        CompanyProfile(
            ticker="NVDA",
            company="NVIDIA Corp.",
            sector="Semiconductors",
            risk="Medium",
            risk_score=54,
            sentiment="Positive",
            summary="NVIDIA shows strong AI infrastructure demand and high profitability, but valuation concentration, supply-chain exposure, and customer concentration keep risk at a medium level.",
            market_cap="$3.0T",
            revenue="$115B",
            debt_to_equity="0.20",
            profit_margin="49.1%",
            grounding_score=91,
            unsupported_claims=1,
            risk_trend=[
                {"month": "Jan", "risk": 44},
                {"month": "Feb", "risk": 47},
                {"month": "Mar", "risk": 50},
                {"month": "Apr", "risk": 56},
                {"month": "May", "risk": 53},
                {"month": "Jun", "risk": 54},
            ],
            red_flags=[
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
            filing_signals=[
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
            peer_benchmark=[
                {"company": "NVDA", "risk": 54, "profitability": 95},
                {"company": "AMD", "risk": 57, "profitability": 72},
                {"company": "INTC", "risk": 69, "profitability": 51},
            ],
            evidence=[
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
        ),
        CompanyProfile(
            ticker="JPM",
            company="JPMorgan Chase",
            sector="Financials",
            risk="Low",
            risk_score=33,
            sentiment="Neutral",
            summary="JPMorgan Chase maintains strong capital position, diversified revenue, and comparatively low credit risk. Interest-rate sensitivity and credit-loss monitoring remain key watch areas.",
            market_cap="$575B",
            revenue="$162B",
            debt_to_equity="1.23",
            profit_margin="29.8%",
            grounding_score=96,
            unsupported_claims=0,
            risk_trend=[
                {"month": "Jan", "risk": 31},
                {"month": "Feb", "risk": 32},
                {"month": "Mar", "risk": 35},
                {"month": "Apr", "risk": 34},
                {"month": "May", "risk": 32},
                {"month": "Jun", "risk": 33},
            ],
            red_flags=[
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
            filing_signals=[
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
            peer_benchmark=[
                {"company": "JPM", "risk": 33, "profitability": 82},
                {"company": "BAC", "risk": 48, "profitability": 69},
                {"company": "C", "risk": 57, "profitability": 61},
            ],
            evidence=[
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
        ),
        CompanyProfile(
            ticker="AAPL",
            company="Apple Inc.",
            sector="Technology",
            risk="Medium",
            risk_score=49,
            sentiment="Neutral",
            summary="Apple remains financially strong with high profitability and brand strength, but revenue concentration, China exposure, and product-cycle dependency keep risk at a medium level.",
            market_cap="$3.1T",
            revenue="$391B",
            debt_to_equity="1.45",
            profit_margin="26.3%",
            grounding_score=90,
            unsupported_claims=1,
            risk_trend=[
                {"month": "Jan", "risk": 42},
                {"month": "Feb", "risk": 44},
                {"month": "Mar", "risk": 47},
                {"month": "Apr", "risk": 51},
                {"month": "May", "risk": 48},
                {"month": "Jun", "risk": 49},
            ],
            red_flags=[
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
            filing_signals=[
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
            peer_benchmark=[
                {"company": "AAPL", "risk": 49, "profitability": 87},
                {"company": "MSFT", "risk": 28, "profitability": 92},
                {"company": "GOOGL", "risk": 37, "profitability": 84},
            ],
            evidence=[
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
        ),
    ]

    db.add_all(companies)
    db.commit()
    print("Company profiles seeded successfully.")

def seed_audit_logs(db):
    existing_count = db.query(AuditLog).count()

    if existing_count > 0:
        print("Audit logs already exist. Skipping audit log seed.")
        return

    audit_logs = [
        AuditLog(
            time="10:42 AM",
            event="Report generated",
            detail="TSLA red flag review generated with 87% grounding score.",
            severity="Info",
        ),
        AuditLog(
            time="10:39 AM",
            event="Unsupported claim detected",
            detail="Two statements required analyst review before approval.",
            severity="Warning",
        ),
        AuditLog(
            time="10:31 AM",
            event="Local model routed",
            detail="Ollama handled 18 sentiment classification tasks.",
            severity="Info",
        ),
        AuditLog(
            time="10:24 AM",
            event="Data source delay",
            detail="GDELT news refresh exceeded latency threshold.",
            severity="Warning",
        ),
    ]

    db.add_all(audit_logs)
    db.commit()
    print("Audit logs seeded successfully.")


def seed_database():
    db = SessionLocal()

    try:
        seed_holdings(db)
        seed_watchlist(db)
        seed_reports(db)
        seed_company_profiles(db)
        seed_audit_logs(db)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()