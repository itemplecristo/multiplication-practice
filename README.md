# Multiplication Practice App ✖️

A clean, minimalist local web application for mastering multiplication tables. Designed with a Google Sites / Material Design aesthetic.

## Features

- **Practice Quiz Mode**:
  - Select individual multiplication tables (1 to 12) or test all tables mixed.
  - Choose round lengths: 10 questions, 20 questions, 50 questions, or endless mode.
  - Optional timers: Stopwatch or 10-second per question countdown.
  - Real-time feedback with streak counter and accuracy stats.
  - Review missed questions with an instant "Practice Missed Only" retry feature.
  - On-screen keypad for mobile / tablet devices in addition to physical keyboard support.

- **Flashcard Mode**:
  - Interactive 3D flip flashcards for rapid recall practice.
  - Filter by single table or all 144 facts.
  - Shuffle deck and loop navigation.
  - Keyboard shortcuts (`Space` to flip, `ArrowLeft` / `ArrowRight` to navigate).

- **Interactive Table Grid**:
  - Dynamic 10×10 and 12×12 multiplication chart.
  - Row and column intersection highlighting on hover/tap.
  - "Hide Numbers (Self Test)" mode to mask cells and tap to reveal answers.

- **Audio & Visual Polish**:
  - Synthesized audio chimes & feedback using Web Audio API (zero external sound files needed).
  - Light & Dark mode support with persistent user preferences in `localStorage`.
  - Zero external dependencies: pure HTML, CSS, and vanilla JavaScript. Runs directly in any browser.

## How to Run

Simply open `index.html` in any modern web browser:

```bash
# On Linux
xdg-open index.html

# Or start a simple local server if preferred
python3 -m http.server 8000
```

## Project Structure

```
multiplication_practice/
├── index.html       # Semantic HTML5 markup and view structures
├── style.css        # Minimalist Google Sites inspired CSS
├── app.js           # Vanilla JS state management & audio synthesis
├── README.md        # Documentation
└── .gitignore       # Git ignore rules
```
