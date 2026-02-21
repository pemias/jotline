"""
RAKE + IDF keyword extraction for voice notes.

Uses RAKE-style candidate generation (split on stopwords) with IDF ranking
from wordfreq. Special handling for Japanese (script-type splitting),
Chinese/Cantonese (jieba segmentation), and Thai (pythainlp segmentation).

Run:  python poc/eval-rake-idf.py
Deps: pip install wordfreq mecab-python3 ipadic jieba regex pythainlp
"""

import json
import math
import re
import sys
import time
import unicodedata
from pathlib import Path

import regex

import jieba
from wordfreq import available_languages as wf_languages
from wordfreq import word_frequency

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

DIR = Path(__file__).parent
INPUT = DIR / "test-cases.jsonl"
OUTPUT = DIR / "results-rake-idf.jsonl"
YAKE_TS = DIR / "results-yake-ts.jsonl"
STOPWORDS_PATH = DIR / "../../stopwords-ai/stopwords.json"

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MAX_KEYWORDS = 3
MIN_IDF = 2.0  # minimum IDF to be considered a keyword (freq < 0.01)
MAX_KW_LEN = 30  # characters
MAX_PHRASE_TOKENS = 3  # split longer phrases into sub-phrases for chip display
DEFAULT_IDF = 7.0  # for words not in wordfreq (very rare = high IDF)

# ---------------------------------------------------------------------------
# Stopwords
# ---------------------------------------------------------------------------

STOPWORDS: dict[str, set[str]] = {}


def load_stopwords():
    global STOPWORDS
    raw = json.loads(STOPWORDS_PATH.read_text("utf-8"))
    for locale, words in raw.items():
        STOPWORDS[locale] = {w.lower() for w in words}


def get_stopwords(locale: str) -> set[str]:
    if locale in STOPWORDS:
        return STOPWORDS[locale]
    base = locale.split("-")[0]
    if base in STOPWORDS:
        return STOPWORDS[base]
    return set()


# ---------------------------------------------------------------------------
# wordfreq helpers
# ---------------------------------------------------------------------------

WF_LANGS = set()


def init_wordfreq():
    global WF_LANGS
    WF_LANGS = set(wf_languages())


def _resolve_wf_lang(locale: str) -> str | None:
    """Resolve a locale to a wordfreq language code, or None."""
    if locale in WF_LANGS:
        return locale
    base = locale.split("-")[0]
    if base in WF_LANGS:
        return base
    if locale == "yue":
        return "zh"
    return None


# Languages where wordfreq.word_frequency() crashes (missing MeCab dicts etc.)
WF_BROKEN: set[str] = set()


def idf_score(word: str, lang: str) -> float | None:
    """Higher = rarer = better keyword. Uses -log10(freq)."""
    wf_lang = _resolve_wf_lang(lang)
    if wf_lang is None or wf_lang in WF_BROKEN:
        return None

    try:
        freq = word_frequency(word.lower(), wf_lang)
    except Exception:
        # Missing MeCab dict or similar — mark as broken, fall back
        WF_BROKEN.add(wf_lang)
        return None

    if freq == 0:
        return DEFAULT_IDF
    return -math.log10(freq)


def idf_score_fallback(word: str, stopwords: set[str]) -> float:
    """Fallback IDF: 0 for stopwords, length-scaled for content words.

    Longer non-stopwords are more likely to be informative keywords.
    Scale: 2-char → 0.5, 4-char → 1.0, 8+ char → 2.0 (capped).
    """
    if word.lower() in stopwords:
        return 0.0
    return min(len(word) / 4.0, 2.0)


# ---------------------------------------------------------------------------
# Script detection
# ---------------------------------------------------------------------------


def char_script(ch: str) -> str:
    cp = ord(ch)
    if 0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF or 0xF900 <= cp <= 0xFAFF:
        return "kanji"
    if 0x3040 <= cp <= 0x309F:
        return "hiragana"
    if 0x30A0 <= cp <= 0x30FF or cp == 0xFF70 or 0xFF66 <= cp <= 0xFF9F:
        return "katakana"
    # CJK for Chinese detection
    if 0x2E80 <= cp <= 0x2EFF or 0x2F00 <= cp <= 0x2FDF:
        return "kanji"  # CJK radicals
    return "other"


def is_cjk_locale(locale: str) -> bool:
    return locale in ("zh", "zh-Hans", "zh-Hant", "yue")


def is_japanese(locale: str) -> bool:
    return locale == "ja"


def is_thai(locale: str) -> bool:
    return locale == "th"


# ---------------------------------------------------------------------------
# Path A: RAKE for space-separated languages
# ---------------------------------------------------------------------------

# \w alone misses Unicode combining marks (Mn/Mc), which fragments Brahmic
# scripts (Hindi, Bengali, Tamil, etc.) at virama / vowel-sign boundaries.
# The `regex` module supports \p{M} (all Mark categories).
TOKEN_RE = regex.compile(r"[\w\p{M}]+")


def rake_extract(text: str, locale: str) -> list[dict]:
    """RAKE-style candidate generation + IDF scoring."""
    stopwords = get_stopwords(locale)

    # Tokenize: find all word-like tokens with their positions
    tokens = []
    for m in TOKEN_RE.finditer(text):
        tokens.append({"word": m.group(), "start": m.start(), "end": m.end()})

    if not tokens:
        return []

    # Split on stopwords to get candidate phrases
    candidates = []
    phrase_start = None

    for i, tok in enumerate(tokens):
        is_stop = tok["word"].lower() in stopwords or len(tok["word"]) < 2

        if is_stop:
            if phrase_start is not None:
                # End of phrase
                candidates.append(_make_phrase(text, tokens, phrase_start, i))
                phrase_start = None
        else:
            if phrase_start is None:
                phrase_start = i

    # Handle phrase at end of text
    if phrase_start is not None:
        candidates.append(_make_phrase(text, tokens, phrase_start, len(tokens)))

    # Split long phrases into sub-phrases for chip-friendly display
    split_candidates = []
    for cand in candidates:
        toks = cand["tokens"]
        if len(toks) <= MAX_PHRASE_TOKENS:
            split_candidates.append(cand)
        else:
            # Sliding window: emit sub-phrases of MAX_PHRASE_TOKENS tokens
            for j in range(0, len(toks) - MAX_PHRASE_TOKENS + 1):
                sub = toks[j : j + MAX_PHRASE_TOKENS]
                surface = text[sub[0]["start"] : sub[-1]["end"]]
                split_candidates.append({"text": surface, "tokens": sub, "score": 0})
            # Also emit individual tokens as single-word candidates
            for t in toks:
                split_candidates.append(
                    {"text": t["word"], "tokens": [t], "score": 0}
                )
    candidates = split_candidates

    # Score candidates — try IDF first, fall back to stopword heuristic
    for cand in candidates:
        words = [t["word"] for t in cand["tokens"]]
        if _has_wordfreq(locale):
            scores = [idf_score(w, locale) for w in words]
            valid = [s for s in scores if s is not None]
            if valid:
                cand["score"] = sum(valid) / len(valid)
                continue
        # Fallback: wordfreq unavailable or all scores None (crashed mid-loop)
        scores = [idf_score_fallback(w, stopwords) for w in words]
        cand["score"] = sum(scores) / len(scores) if scores else 0

    return candidates


def _make_phrase(text: str, tokens: list, start_idx: int, end_idx: int) -> dict:
    """Build a candidate phrase from token range."""
    phrase_tokens = tokens[start_idx:end_idx]
    surface = text[phrase_tokens[0]["start"] : phrase_tokens[-1]["end"]]
    return {"text": surface, "tokens": phrase_tokens, "score": 0}


def _has_wordfreq(locale: str) -> bool:
    wf_lang = _resolve_wf_lang(locale)
    return wf_lang is not None and wf_lang not in WF_BROKEN


# ---------------------------------------------------------------------------
# Path B: Japanese script-type splitting
# ---------------------------------------------------------------------------


def japanese_extract(text: str) -> list[dict]:
    """Extract keywords from Japanese by script-type splitting."""
    candidates = []
    current_run = []
    current_script = None

    for ch in text:
        s = char_script(ch)
        # Long vowel mark ー belongs with katakana
        if ch == "ー" and current_script == "katakana":
            s = "katakana"

        if s in ("kanji", "katakana"):
            if s == current_script:
                current_run.append(ch)
            else:
                # Flush previous run
                if current_run and current_script in ("kanji", "katakana"):
                    _flush_ja_run(candidates, current_run, current_script)
                current_run = [ch]
                current_script = s
        else:
            # Non-keyword character — flush
            if current_run and current_script in ("kanji", "katakana"):
                _flush_ja_run(candidates, current_run, current_script)
            current_run = []
            current_script = s

    # Flush final run
    if current_run and current_script in ("kanji", "katakana"):
        _flush_ja_run(candidates, current_run, current_script)

    # Score with wordfreq
    for cand in candidates:
        cand["score"] = idf_score(cand["text"], "ja") or DEFAULT_IDF

    return candidates


def _flush_ja_run(candidates: list, run: list[str], script: str):
    word = "".join(run)
    # Filter single-character kanji (too ambiguous)
    if script == "kanji" and len(word) == 1:
        return

    if script == "kanji" and len(word) > 2:
        # Long kanji runs are often concatenated words (来月切 = 来月+切).
        # If wordfreq knows the full run, emit it as-is (冷蔵庫, 期限切).
        # Otherwise, decompose into known bigrams only (来月切 → 来月).
        try:
            freq_full = (
                word_frequency(word, "ja") if "ja" not in WF_BROKEN else 0
            )
        except Exception:
            freq_full = 0
        if freq_full > 0:
            candidates.append({"text": word, "score": 0})
        else:
            for i in range(len(word) - 1):
                bigram = word[i : i + 2]
                try:
                    freq_bi = (
                        word_frequency(bigram, "ja")
                        if "ja" not in WF_BROKEN
                        else 0
                    )
                except Exception:
                    freq_bi = 0
                if freq_bi > 0:
                    candidates.append({"text": bigram, "score": 0})
    else:
        candidates.append({"text": word, "score": 0})


# ---------------------------------------------------------------------------
# Path C: Chinese / Cantonese (jieba)
# ---------------------------------------------------------------------------


def chinese_extract(text: str, locale: str) -> list[dict]:
    """Extract keywords from Chinese using jieba segmentation."""
    stopwords = get_stopwords(locale)

    # jieba segmentation
    words = list(jieba.cut(text))

    candidates = []
    for w in words:
        w_stripped = w.strip()
        if not w_stripped:
            continue
        # Skip punctuation
        if all(unicodedata.category(ch).startswith("P") or ch.isspace() for ch in w_stripped):
            continue
        # Skip stopwords
        if w_stripped.lower() in stopwords:
            continue
        # Skip single-character function words
        if len(w_stripped) == 1 and is_common_chinese_char(w_stripped):
            continue

        score = idf_score(w_stripped, "zh") or DEFAULT_IDF
        candidates.append({"text": w_stripped, "score": score})

    return candidates


def is_common_chinese_char(ch: str) -> bool:
    """Check if a single Chinese character is likely a function word."""
    # Common single-char function words / particles
    common = set("的是在了我和有不人也你为他这中大会就说到时要都上出来个把去能下过")
    return ch in common


# ---------------------------------------------------------------------------
# Path D: Thai (pythainlp)
# ---------------------------------------------------------------------------


def thai_extract(text: str, locale: str) -> list[dict]:
    """Extract keywords from Thai using pythainlp word segmentation."""
    from pythainlp import word_tokenize

    stopwords = get_stopwords(locale)
    words = word_tokenize(text, engine="newmm")

    candidates = []
    for w in words:
        w_stripped = w.strip()
        if not w_stripped:
            continue
        # Skip punctuation and whitespace
        if all(
            unicodedata.category(ch).startswith("P") or ch.isspace()
            for ch in w_stripped
        ):
            continue
        # Skip stopwords
        if w_stripped.lower() in stopwords:
            continue
        # Skip single-character tokens
        if len(w_stripped) == 1:
            continue

        score = idf_score(w_stripped, "th") or DEFAULT_IDF
        candidates.append({"text": w_stripped, "score": score})

    return candidates


# ---------------------------------------------------------------------------
# Selection: top-k with substring dedup
# ---------------------------------------------------------------------------


def select_keywords(
    candidates: list[dict], max_kw: int = MAX_KEYWORDS, has_idf: bool = True
) -> list[str]:
    """Select top keywords with substring dedup and confidence gate."""
    # Sort by score descending (higher IDF = rarer = better)
    sorted_cands = sorted(candidates, key=lambda c: c["score"], reverse=True)

    # Confidence gate threshold: wordfreq languages use IDF scale (1-7),
    # fallback languages use binary (0-1)
    min_score = MIN_IDF if has_idf else 0.5

    selected: list[str] = []
    for cand in sorted_cands:
        if len(selected) >= max_kw:
            break

        text = cand["text"].strip()
        lower = text.lower()

        # Skip too long
        if len(text) > MAX_KW_LEN:
            continue

        # Skip too short
        if len(text) < 2:
            continue

        # Confidence gate
        if cand["score"] < min_score:
            continue

        # Substring dedup: skip if overlaps with already selected
        is_dup = False
        for existing in selected:
            ex_lower = existing.lower()
            if lower in ex_lower or ex_lower in lower:
                is_dup = True
                break
        if is_dup:
            continue

        selected.append(text)

    return selected


# ---------------------------------------------------------------------------
# Main extraction entry point
# ---------------------------------------------------------------------------


def extract_keywords(text: str, locale: str) -> list[str]:
    """Extract keywords from a transcript."""
    if is_japanese(locale):
        candidates = japanese_extract(text)
    elif is_cjk_locale(locale):
        candidates = chinese_extract(text, locale)
    elif is_thai(locale):
        candidates = thai_extract(text, locale)
    else:
        candidates = rake_extract(text, locale)

    # Check has_idf AFTER extraction — wordfreq may have crashed during
    # idf_score() and added the language to WF_BROKEN (Korean MeCab issue).
    has_idf = _has_wordfreq(locale)

    return select_keywords(candidates, has_idf=has_idf)


# ---------------------------------------------------------------------------
# Eval runner
# ---------------------------------------------------------------------------


def main():
    sys.stdout.reconfigure(encoding="utf-8")

    load_stopwords()
    init_wordfreq()

    # Suppress jieba logging
    jieba.setLogLevel(jieba.logging.WARNING)

    cases = [json.loads(line) for line in INPUT.read_text("utf-8").strip().split("\n")]

    print(f"RAKE+IDF Keyword Extraction")
    print(f"Cases: {len(cases)}")
    print(f"Output: {OUTPUT}")
    print(f"wordfreq languages: {len(WF_LANGS)}")
    print()

    results = []
    fabricated = 0
    lang_stats: dict[str, dict] = {}

    for i, tc in enumerate(cases):
        start = time.perf_counter()
        keywords = extract_keywords(tc["transcript"], tc["locale"])
        duration_ms = (time.perf_counter() - start) * 1000

        # Check in-transcript (sanity check)
        transcript_lower = tc["transcript"].lower()
        all_in = len(keywords) > 0 and all(
            k.lower() in transcript_lower for k in keywords
        )
        if not all_in and len(keywords) > 0:
            fabricated += 1

        lang = tc["lang"]
        if lang not in lang_stats:
            lang_stats[lang] = {"total": 0, "in_transcript": 0, "kw_count": 0}
        lang_stats[lang]["total"] += 1
        if all_in:
            lang_stats[lang]["in_transcript"] += 1
        lang_stats[lang]["kw_count"] += len(keywords)

        results.append(
            {
                "id": tc["id"],
                "lang": tc["lang"],
                "transcript": tc["transcript"],
                "keywords": [k.lower() for k in keywords],
                "allInTranscript": all_in,
                "durationMs": round(duration_ms, 1),
            }
        )

        if (i + 1) % 50 == 0 or i + 1 == len(cases):
            pct = (i + 1) / len(cases) * 100
            fab_pct = fabricated / (i + 1) * 100
            print(
                f"\r  {i+1}/{len(cases)} ({pct:.0f}%) — {fab_pct:.1f}% fabricated",
                end="",
                flush=True,
            )

    print("\n")

    # Write results
    OUTPUT.write_text(
        "\n".join(json.dumps(r, ensure_ascii=False) for r in results) + "\n",
        encoding="utf-8",
    )

    # --- Summary ---
    total_in = sum(1 for r in results if r["allInTranscript"])
    avg_kw = sum(len(r["keywords"]) for r in results) / len(results)
    avg_dur = sum(r["durationMs"] for r in results) / len(results)

    print("=== SUMMARY ===")
    print(
        f"All keywords in transcript: {total_in}/{len(results)} ({total_in/len(results)*100:.1f}%)"
    )
    print(f"Avg keywords per note: {avg_kw:.1f}")
    print(f"Avg latency: {avg_dur:.1f}ms")
    print()

    # Per-language
    print("=== PER LANGUAGE (keywords-in-transcript rate) ===")
    lang_entries = sorted(
        lang_stats.items(),
        key=lambda x: x[1]["in_transcript"] / x[1]["total"],
    )
    for lang, s in lang_entries:
        pct = s["in_transcript"] / s["total"] * 100
        avg = s["kw_count"] / s["total"]
        bar = "\u2588" * round(pct / 5)
        print(f"  {lang:<25} {pct:>3.0f}% {bar:<20s}  ({s['in_transcript']}/{s['total']})  avg_kw={avg:.1f}")

    # Fabrications
    failures = [r for r in results if not r["allInTranscript"] and len(r["keywords"]) > 0]
    if failures:
        n = min(15, len(failures))
        print(f"\n=== FABRICATIONS ({n} of {len(failures)}) ===")
        for f in failures[:15]:
            print(f"  [{f['id']}] \"{f['transcript'][:80]}\"")
            print(f"    keywords: {f['keywords']}")
            # Show which keywords aren't in transcript
            t_lower = f["transcript"].lower()
            bad = [k for k in f["keywords"] if k not in t_lower]
            print(f"    not found: {bad}")
            print()

    # --- Comparison with YAKE-TS ---
    if YAKE_TS.exists():
        print("=== COMPARISON: RAKE+IDF vs YAKE-TS ===")
        yake_results = {
            r["id"]: r
            for r in (
                json.loads(line)
                for line in YAKE_TS.read_text("utf-8").strip().split("\n")
            )
        }

        # Sample across key languages
        sample_ids = [
            # English
            "en-dentist", "en-grocery", "en-school-play", "en-plants-vet", "en-app-idea",
            # German
            "de-arzttermin", "de-geburtstagsfeier", "de-fahrrad-reparatur",
            # French
            "fr-cadeau-marie", "fr-voiture-controle", "fr-reunion-parents",
            # Spanish
            "es-dentista-limpieza", "es-leche-pan", "es-coche-taller",
            # Japanese
            "ja-shaken-yoyaku", "ja-gyunyu-kigen", "ja-hikoshi-nimotsu",
            "ja-haha-purezento", "ja-nikkei-kaigi",
            # Chinese
            "zh-bank-card", "zh-kongtiao-repair", "zh-huiyi-ppt",
            # Cantonese
            "yue-gaisi", "yue-yisang", "yue-leuhang",
            # Korean (race condition test)
            "ko-yeonghwa-yeyak", "ko-jeonhwa-umma",
            # Brahmic/Indic (combining mark tokenization test)
            "hi-bazar-sabzi", "hi-meeting-boss", "bn-bazaar",
            "ta-maligai-kadai", "ta-pallu-doctor",
            # Thai (pythainlp segmentation test)
            "th-renew-registration", "th-naam-rot", "th-prachum-wan-jan",
        ]

        for sid in sample_ids:
            r = next((r for r in results if r["id"] == sid), None)
            y = yake_results.get(sid)
            if r and y:
                print(f"  [{sid}] {r['lang']}")
                print(f"  transcript: {r['transcript'][:80]}")
                print(f"  YAKE-TS:    {y['keywords']}")
                print(f"  RAKE+IDF:   {r['keywords']}")
                print()


if __name__ == "__main__":
    main()
