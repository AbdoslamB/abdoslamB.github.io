---
title: 'Building InkDoc: clean Markdown from any document'
description: 'Why I built a desktop app that turns PDFs, Office files and scans into AI-ready Markdown, and what I learned shipping it.'
date: 2026-10-02
tags: ['Python', 'Document AI', 'Open source']
draft: true
---

<!-- DRAFT: an outline built from the InkDoc README. The facts are filled in;
     the story (why, what was hard, what you learned) needs your voice.
     When it's ready, set `draft: false`. -->

## The problem

<!-- DRAFT: what pushed you to build this? A pipeline that choked on PDFs?
     Copy-pasting from scans? -->

Large language models and RAG pipelines work best on clean text, but most real documents are PDFs, Word files, slides and scans.

## What InkDoc does

[InkDoc](https://github.com/AbdoslamB/InkDoc) is a desktop workbench and local REST API. You drop in a file, folder or URL, conversion starts straight away, and clean Markdown is saved to your Downloads folder with collision-safe file names.

It brings four engines together behind one interface:

- **Microsoft MarkItDown**
- **Docling**
- **Markit**, for a broad range of formats
- **GLM-OCR**, for scanned pages

Most conversions run on your own machine.

## Shipping it

<!-- DRAFT: packaging for Windows, macOS (Apple Silicon) and Linux with no
     Python install required. What was hardest? -->

InkDoc ships as ready-to-run packages for Windows, macOS and Linux, with every dependency bundled, so nobody needs to install Python.

## What I learned

<!-- DRAFT: 3 lessons. -->

[Download InkDoc](https://github.com/AbdoslamB/InkDoc/releases/latest) or read the [source on GitHub](https://github.com/AbdoslamB/InkDoc).
