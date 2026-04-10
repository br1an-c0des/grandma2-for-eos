"""Extract PDF content to structured JSON with color metadata."""
import fitz
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

doc = fitz.open("gMA2 for Eos Programmers v1.0.1.pdf")

# Color mapping
MA2_ORANGE_COLORS = {0xFF9100, 0xFFAF00}
EOS_BLUE = 0x0077FF

# Known section titles (detected from font analysis)
# These are the real topic-level headers in the document
KNOWN_SECTIONS = {
    "Introduction",
    "Tips for reading the guide",
    "A few core concepts about MA2:",
    "SYNTAX ORDER",
    "CHANNEL SELECTION",
    'THE "PROGRAMMER"',
    "THE \u201cPROGRAMMER\u201d",
    "FIXTURE # VS CHANNEL #",
    "ORGANIZATION OF ATTRIBUTES",
    "A NOTE ON WORKFLOW AND COMMANDS",
    "GENERAL COMMANDS AND TERMS:",
    "DISPLAYS & VIEWS",
    "PATCH",
    "MORE COMMANDS",
    "PRESETS",
    "IF",
    "OTHER COMMANDS",
    "EFFECTS",
    "Non-Similar Commands & Syntax - Important commands on MA2:",
    "BLIND & PREVIEW",
    "EXECUTOR/FADER OPTIONS",
    "External Resources",
}


def classify_color(color_int):
    if color_int in MA2_ORANGE_COLORS:
        return "ma2"
    elif color_int == EOS_BLUE:
        return "eos"
    return None


def is_section_header(spans, text):
    """Determine if a line is a section header."""
    if not text or len(text) < 2:
        return False
    # Check against known sections
    if text in KNOWN_SECTIONS:
        return True
    # DemiBold, size >= 13, all black, not a note/footnote
    all_demibold = all(
        "DemiBold" in s["font"] for s in spans if s["text"].strip()
    )
    any_big = any(s["size"] >= 13 for s in spans)
    all_black = all(s["color"] == 0 for s in spans if s["text"].strip())
    if all_demibold and any_big and all_black and text == text.upper() and len(text) > 3:
        return True
    return False


sections = []
current_section = None

for page_idx in range(len(doc)):
    page = doc[page_idx]
    blocks = page.get_text("dict")["blocks"]

    # Skip title page
    if page_idx == 0:
        continue

    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            spans = line["spans"]
            if not spans:
                continue

            # Build line text and segments
            all_text = "".join(s["text"] for s in spans).strip()
            if not all_text:
                continue

            # Skip page footers
            if "MA2 for Eos Programmers" in all_text and str(page_idx + 1) in all_text:
                continue
            if all_text == "Brian Abbott":
                continue

            if is_section_header(spans, all_text):
                if current_section:
                    sections.append(current_section)
                current_section = {
                    "title": all_text.rstrip(":"),
                    "page": page_idx + 1,
                    "lines": [],
                }
                continue

            # Build rich segments
            segments = []
            for span in spans:
                t = span["text"]
                if not t:
                    continue
                seg = {"text": t}
                color_class = classify_color(span["color"])
                if color_class:
                    seg["color"] = color_class
                is_bold = "Bold" in span["font"]
                if is_bold:
                    seg["bold"] = True
                segments.append(seg)

            if current_section is None:
                current_section = {
                    "title": "Introduction",
                    "page": page_idx + 1,
                    "lines": [],
                }

            if segments:
                current_section["lines"].append(segments)

if current_section:
    sections.append(current_section)

# Write output
with open("content.json", "w", encoding="utf-8") as f:
    json.dump(sections, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(sections)} sections:")
for s in sections:
    print(f'  p{s["page"]}: {s["title"]} ({len(s["lines"])} lines)')
