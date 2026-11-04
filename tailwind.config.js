/** Tailwind build config. Design tokens live in src/styles/tokens.css; the colours here point at them
 *  so a token change updates every utility. */
module.exports = {
    content: ['./index.html', './app.js', './account.js', './scripts/**/*.mjs'],
    // Grid column classes that app.js builds at runtime from a count
    safelist: [{ pattern: /grid-cols-[1-6]/, variants: ['md', 'lg'] }],
    theme: {
        extend: {
            colors: {
                paper: 'var(--paper)',
                stone: 'var(--stone)',
                line: 'var(--line)',
                mute: 'var(--mute)',
                'ink-2': 'var(--ink-2)',
                ink: 'var(--ink)',
                green: 'var(--green)',
                'green-text': 'var(--green-text)',
                band: 'var(--band)',
                'on-band': 'var(--on-band)',
                'on-band-mute': 'var(--on-band-mute)',
                'on-green': 'var(--on-green)'
            },
            fontFamily: {
                sans: ['"Instrument Sans Variable"', 'system-ui', 'sans-serif'],
                display: ['"Newsreader Variable"', 'Georgia', 'serif']
            },
            maxWidth: {
                site: '85rem' // 1360px content width
            },
            transitionTimingFunction: {
                site: 'cubic-bezier(0.22, 1, 0.36, 1)'
            }
        }
    }
};
