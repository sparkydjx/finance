"""FinBERT sentiment helper for finance headlines/text."""

from __future__ import annotations

from functools import lru_cache
from typing import Dict, List

from transformers import pipeline

FINBERT_MODEL = "ProsusAI/finbert"


@lru_cache(maxsize=1)
def _get_finbert_pipeline():
    """Load and cache the FinBERT pipeline once per process."""
    return pipeline("text-classification", model=FINBERT_MODEL)


def analyze_finbert_sentiment(text: str) -> Dict[str, float | str]:
    """Return FinBERT sentiment label and confidence for input text."""
    clean_text = str(text or "").strip()
    if not clean_text:
        raise ValueError("Input text is required.")

    classifier = _get_finbert_pipeline()
    result = classifier(clean_text)[0]
    label = str(result["label"]).lower()
    score = float(result["score"])
    return {"label": label, "score": score}


def analyze_many(texts: List[str]) -> List[Dict[str, float | str]]:
    """Batch sentiment scoring for multiple text inputs."""
    classifier = _get_finbert_pipeline()
    clean_texts = [str(item or "").strip() for item in texts]
    if not clean_texts or any(not item for item in clean_texts):
        raise ValueError("All input texts must be non-empty.")

    raw_results = classifier(clean_texts)
    return [{"label": str(item["label"]).lower(), "score": float(item["score"])} for item in raw_results]


if __name__ == "__main__":
    import sys

    user_text = " ".join(sys.argv[1:]).strip()
    if not user_text:
        print('Usage: python finbert_service.py "Your finance headline here"')
        raise SystemExit(1)

    print(analyze_finbert_sentiment(user_text))
