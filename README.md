# Your GPA Must Be Desperate

A browser quiz game. Pick a deck, answer before time runs out, and keep your streak through the boss wave. Play Easy Math, Everyday Science, English Essentials, or World Geography right away.

## Run locally

Open `index.html` to play, import material, or connect directly to an AI endpoint that allows browser requests (CORS). To use the local AI proxy, install Node.js 22 or newer, then run this command in the project folder.

```sh
npm start
```

Open [the local game](http://127.0.0.1:8766/). Set `GPA_PORT` if you need a different port. The server listens on the loopback interface.

## Play and make decks

- Choose a deck and select **Start run**. Press **1–4** to answer, **Space** to advance through feedback, or **R** to start or retry from the ready screen or results.
- **Stop run** or **Esc** ends the attempt as a failed run and shows missed questions with their correct answers. Select **Retry run** to try the same deck again.
- **Add material** accepts text-based PDFs, text files, Markdown, and pasted notes. The local question builder runs in the browser.
- **Configure AI** lets you select Ollama, OpenAI, Anthropic, Google Gemini, OpenRouter, or a custom endpoint. Enter the provider's model ID and API key when required, then select **Use connection**. In **Add material**, choose **A connected agent** and select **Generate questions**.
- **Edit deck** lets you revise imported questions, choices, and explanations. Mark the correct choice with its radio button.

In **Configure AI**, choose **Add a custom connection** to enter an OpenAI-compatible chat endpoint or a webhook that accepts `{"prompt":"..."}` and returns the deck JSON. Choose **Use an AI chat manually** to copy a prompt into a separate chat and import its reply.

Decks, scores, and connection settings are saved in your browser. API keys stay in the current tab's memory. Using **Generate questions** sends the selected material to the provider you configured.

## Repository

Serve the repository root as a static site for the demo, local question builder, browser AI connections, and manual JSON import. The optional local AI proxy uses `server.mjs`.

- `index.html`, `styles.css`, and `game.js` contain the game interface and logic.
- `demo-decks.js` contains the preset decks.
- `materials.js` handles file imports, deck validation, and local deck storage.
- `assets/` contains the Tuz mascot sprites.
- `vendor/` contains the browser builds of PDF.js and GSAP, and the Instrument Serif font. The PDF.js and font license files are included. GSAP's notice is in its bundle. [GSAP license](https://gsap.com/standard-license/)
