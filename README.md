# grandMA2 for Eos Programmers

A reference guide for lighting programmers translating between **grandMA2** and **ETC Eos** consoles — and vice versa.

Written by [Brian Abbott]

## About

This guide started as a personal set of notes comparing common commands and concepts between the two console families. It covers syntax differences, channel selection, presets, effects, executor options, and more — organized as a quick-reference for programmers who already know one platform and need to work on the other.

## Website

The guide is available as a searchable website with dark/light mode:

**[View the guide →](https://brianabbott.github.io/grandma2-for-eos/)**

## Local Development

The site is static HTML/CSS/JS. To run locally:

```bash
python -m http.server
```

Then open `http://localhost:8000` in your browser.

### Rebuilding from PDF

If you need to re-extract content from the source PDF:

```bash
pip install pymupdf
python extract_pdf.py
```

This generates `content.json`, which the site reads at runtime.

## License

Content © Brian Abbott. All rights reserved.
