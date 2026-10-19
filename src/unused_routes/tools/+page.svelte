<h1>Tools</h1>

<nav>
    <ul>
        <li>
            <a href="metronome" title="metronome">
                <div class="tool-icon">
                    <svg viewBox="0 0 100 100">
                        <path d="M 51 10 v 60 h 20 Z" fill="black"></path>
                        <path d="M 49 10 v 60 h -20 Z" fill="black"></path>
                        <line
                            x1="50"
                            y1="70"
                            x2="70"
                            y2="30"
                            stroke="black"
                            stroke-width="2"
                        ></line>
                        <text
                            x="10"
                            y="90"
                            font-family="monospace"
                            font-size="16">Metronome</text
                        >
                    </svg>
                </div>
            </a>
        </li>
        <li>
            <a href="meditone" title="meditone">
                <div class="tool-icon">
                    <svg viewBox="0 0 100 100">
                        <path
                            d="M 20 40 h 15 l 5 -15 l 5 30 l 8 -37 l 3 40 l 6 -20 h 12"
                            fill="none"
                            stroke="black"
                            stroke-width="2"
                        ></path>
                        <text
                            x="15"
                            y="90"
                            font-family="monospace"
                            font-size="16">Meditone</text
                        >
                    </svg>
                </div>
            </a>
        </li>
    </ul>
</nav>

<style>
    a {
        text-decoration: none;
        color: blue;
    }

    ul {
        list-style: none;
        padding-left: 0;

        display: flex;
        gap: 1rem;
    }

    svg {
        border: 1px solid black;
        border-radius: 8px;
        user-select: none;
    }

    nav {
        margin-top: 1rem;
    }

    .tool-icon {
        width: 120px;
    }
</style>
