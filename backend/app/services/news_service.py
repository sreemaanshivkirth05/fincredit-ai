from datetime import datetime, timezone
from typing import Any, Optional

import yfinance as yf


def normalize_ticker(ticker: str) -> str:
    return ticker.strip().upper()


def safe_get_nested(source: Any, keys: list[str]):
    current = source

    for key in keys:
        if not isinstance(current, dict):
            return None

        current = current.get(key)

        if current is None:
            return None

    return current


def format_timestamp(value: Any) -> Optional[str]:
    if value is None:
        return None

    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, tz=timezone.utc).isoformat()

        if isinstance(value, str):
            return value

        return str(value)
    except Exception:
        return None


def extract_thumbnail(item: dict):
    thumbnail = item.get("thumbnail")

    if isinstance(thumbnail, dict):
        resolutions = thumbnail.get("resolutions")

        if isinstance(resolutions, list) and resolutions:
            url = resolutions[-1].get("url")
            if url:
                return url

        url = thumbnail.get("url")
        if url:
            return url

    content_thumbnail = safe_get_nested(item, ["content", "thumbnail"])

    if isinstance(content_thumbnail, dict):
        resolutions = content_thumbnail.get("resolutions")

        if isinstance(resolutions, list) and resolutions:
            url = resolutions[-1].get("url")
            if url:
                return url

        url = content_thumbnail.get("url")
        if url:
            return url

    return None


def normalize_news_item(item: dict):
    content = item.get("content") if isinstance(item.get("content"), dict) else item

    title = (
        content.get("title")
        or item.get("title")
        or content.get("headline")
        or item.get("headline")
    )

    if not title:
        return None

    publisher = (
        safe_get_nested(content, ["provider", "displayName"])
        or content.get("publisher")
        or item.get("publisher")
        or item.get("provider")
    )

    link = (
        safe_get_nested(content, ["canonicalUrl", "url"])
        or safe_get_nested(content, ["clickThroughUrl", "url"])
        or content.get("link")
        or content.get("url")
        or item.get("link")
        or item.get("url")
    )

    summary = (
        content.get("summary")
        or content.get("description")
        or item.get("summary")
        or item.get("description")
        or ""
    )

    published_at = (
        format_timestamp(content.get("pubDate"))
        or format_timestamp(content.get("displayTime"))
        or format_timestamp(content.get("providerPublishTime"))
        or format_timestamp(item.get("providerPublishTime"))
        or format_timestamp(item.get("publishedAt"))
    )

    news_type = content.get("contentType") or item.get("type") or "Story"

    return {
        "title": str(title),
        "publisher": str(publisher) if publisher else None,
        "link": str(link) if link else None,
        "summary": str(summary) if summary else None,
        "publishedAt": published_at,
        "thumbnail": extract_thumbnail(item),
        "type": str(news_type) if news_type else None,
    }


def get_stock_news_data(ticker: str, limit: int = 8):
    cleaned_ticker = normalize_ticker(ticker)
    safe_limit = max(1, min(limit, 20))

    stock = yf.Ticker(cleaned_ticker)
    raw_news = stock.news or []

    normalized_news = []

    for item in raw_news:
        if not isinstance(item, dict):
            continue

        normalized_item = normalize_news_item(item)

        if normalized_item:
            normalized_news.append(normalized_item)

        if len(normalized_news) >= safe_limit:
            break

    return {
        "ticker": cleaned_ticker,
        "count": len(normalized_news),
        "news": normalized_news,
        "source": "yfinance",
        "message": f"{cleaned_ticker} news loaded from yfinance",
    }