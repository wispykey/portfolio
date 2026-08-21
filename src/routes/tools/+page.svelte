<h1>Tools</h1>

<p>
    Here is where I put interactive projects that I created for learning, and
    may or may not be useful.
</p>

<nav>
    <ul>
        <li>
            <a href="metronome" title="metronome">
                <svg width="100" height="100">
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
                    <text x="6" y="90">Metronome</text>
                </svg>
            </a>
        </li>
        <li>
            <a href="meditone" title="meditone">
                <svg width="100" height="100">
                    <path
                        d="M 20 40 h 15 l 5 -15 l 5 30 l 8 -37 l 3 40 l 6 -20 h 12"
                        fill="none"
                        stroke="black"
                        stroke-width="2"
                    ></path>

                    <text x="13" y="90">Meditone</text>
                </svg>
            </a>
        </li>
    </ul>
</nav>

<style>
    button {
        padding: 1rem;
    }

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
</style>
