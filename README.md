# معلم القرآن — امتحانی تیاری (Muallim-ul-Quran Exam Prep)

A static, lesson-wise exam-preparation website for **معلم القرآن (حصہ اول)** by Dr. Ubaid-ur-Rahman Bashir,
covering the **whole book** — **Unit 1 (19 lessons)**, **Unit 2 (13 lessons)** and **Unit 3 (12 sections incl. introduction and sample paper)**, pages 1–103.

* Arabic text → **Amiri**; Urdu text → **Jameel Noori Nastaleeq** (both bundled in `assets/fonts/`, no CDN needed)
* Per lesson: **Study** (rules, examples, word/phrase cards with hide-translation self-test) · **Exercises** (book mashq with tap-to-reveal answers) · **Quiz** · **Flashcards**
* **Colour-coded languages**: Arabic (deep green, fully vowelled), Urdu (deep crimson), English (deep blue). Header buttons toggle **harakat (اعراب) on/off** and **English on/off** (remembered in the browser)
* **Many more MCQs per lesson**: 6 question types (Arabic↔Urdu↔English); choose 10/20/30/50/All per lesson (≈50–1000 questions available per lesson)
* **Exam practice** page: random MCQs from any unit or all three (up to 100 questions)
* Progress ("lesson done") is stored in the browser (`localStorage`); dark mode; mobile friendly; printable

## Run locally
No build step. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Publish on GitHub Pages
1. Push this folder to a GitHub repo (branch `main`).
2. *Settings → Pages → Build and deployment → Source: **GitHub Actions*** (the workflow in `.github/workflows/pages.yml` deploys automatically).
   Alternatively choose *Deploy from a branch → main / (root)*.

## Structure
```
index.html            app shell
assets/css/style.css  styles + @font-face
assets/js/app.js      router, renderer, quiz, flashcards
assets/fonts/         Amiri (OFL), Jameel Noori Nastaleeq
data/unit1-*.js       Unit 1 lessons   (window.MQ.lessons)
data/unit2-*.js       Unit 2 lessons
data/unit3-*.js       Unit 3 lessons
data/en.js            English meanings (MQ.en, keyed by unvowelled Arabic)
data/meta.js          unit titles
```
Lesson kinds: *vocab* (words + exercises q1–q7), *plural* (singular/plural pairs), *grammar* (rule + phrase groups + mashq).
Add or fix content by editing the data files only.

## Important note on content
The book leaves most meanings and all exercise answers blank (the student fills them in).
The **Urdu meanings, translations and answers on this site were added for study purposes** and
should be checked against the book / your teacher before the exam. Exercises were transcribed from
scanned pages; a few low-resolution items may differ slightly from the printed book.

**Page 101 of the supplied PDF scan is missing**, so lesson 9 of Unit 3 (p.101) is only a placeholder built from its neighbours — please check it against the printed book.
The English meanings were also added by the site author, not taken from the book.

## Credits & licences
Book content © its author/publisher — used here only as study notes. Amiri: SIL OFL 1.1.
Jameel Noori Nastaleeq: Noori Nastaleeq by Jameel Khat (see the font's own licence).
