from io import BytesIO
from textwrap import wrap

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def _safe_text(value):
    if value is None:
        return ""
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _clean_markdown(text: str):
    return (
        text.replace("**", "")
        .replace("###", "")
        .replace("##", "")
        .replace("#", "")
        .strip()
    )


def build_report_pdf(report_document):
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        rightMargin=0.7 * inch,
        leftMargin=0.7 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "FinCreditTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#111827"),
        spaceAfter=14,
    )

    section_style = ParagraphStyle(
        "FinCreditSection",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1f2937"),
        spaceBefore=14,
        spaceAfter=8,
    )

    body_style = ParagraphStyle(
        "FinCreditBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#374151"),
        spaceAfter=8,
    )

    small_style = ParagraphStyle(
        "FinCreditSmall",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#4b5563"),
    )

    story = []

    report_id = _safe_text(report_document.report_id)
    ticker = _safe_text(report_document.ticker or "Portfolio")
    created_at = report_document.created_at.strftime("%Y-%m-%d %H:%M:%S")

    story.append(Paragraph("FinCredit AI Analyst Report", title_style))
    story.append(
        Paragraph(
            f"Report ID: <b>{report_id}</b> | Ticker: <b>{ticker}</b> | Agent Run ID: <b>{report_document.agent_run_id}</b>",
            small_style,
        )
    )
    story.append(Paragraph(f"Created: {created_at}", small_style))
    story.append(Spacer(1, 12))

    metadata_table = Table(
        [
            ["Report ID", report_id],
            ["Ticker", ticker],
            ["Agent Run ID", str(report_document.agent_run_id)],
            ["Created At", created_at],
        ],
        colWidths=[1.5 * inch, 4.8 * inch],
    )

    metadata_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#111827")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d1d5db")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    story.append(metadata_table)

    story.append(Paragraph("Analyst Question", section_style))
    story.append(Paragraph(_safe_text(report_document.question), body_style))

    story.append(Paragraph("AI Analyst Response", section_style))

    cleaned_answer = _clean_markdown(report_document.answer)
    answer_paragraphs = [p.strip() for p in cleaned_answer.split("\n") if p.strip()]

    for paragraph in answer_paragraphs:
        story.append(Paragraph(_safe_text(paragraph), body_style))

    story.append(Paragraph("Risk Drivers", section_style))

    risk_items = []
    for risk in report_document.risk_drivers:
        ticker_value = _safe_text(risk.get("ticker", "N/A"))
        driver = _safe_text(risk.get("driver", ""))
        impact = _safe_text(risk.get("impact", "N/A"))
        risk_items.append(
            ListItem(
                Paragraph(
                    f"<b>{ticker_value}</b> - {driver} <br/><b>Impact:</b> {impact}",
                    body_style,
                )
            )
        )

    if risk_items:
        story.append(ListFlowable(risk_items, bulletType="bullet"))
    else:
        story.append(Paragraph("No risk drivers stored for this report.", body_style))

    story.append(Paragraph("Evidence Used", section_style))

    evidence_rows = [["Source", "Claim", "Confidence"]]

    for evidence in report_document.evidence:
        evidence_rows.append(
            [
                Paragraph(_safe_text(evidence.get("source", "N/A")), small_style),
                Paragraph(_safe_text(evidence.get("claim", "")), small_style),
                Paragraph(f"{_safe_text(evidence.get('confidence', 0))}%", small_style),
            ]
        )

    if len(evidence_rows) > 1:
        evidence_table = Table(
            evidence_rows,
            colWidths=[1.4 * inch, 4.1 * inch, 0.9 * inch],
            repeatRows=1,
        )

        evidence_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d1d5db")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )

        story.append(evidence_table)
    else:
        story.append(Paragraph("No evidence items stored for this report.", body_style))

    story.append(Paragraph("Suggested Actions", section_style))

    action_items = [
        ListItem(Paragraph(_safe_text(action), body_style))
        for action in report_document.suggested_actions
    ]

    if action_items:
        story.append(ListFlowable(action_items, bulletType="1"))
    else:
        story.append(Paragraph("No suggested actions stored for this report.", body_style))

    story.append(Spacer(1, 16))
    story.append(
        Paragraph(
            "Generated by FinCredit AI. This report is for analytical review only and is not investment advice.",
            small_style,
        )
    )

    doc.build(story)

    buffer.seek(0)
    return buffer