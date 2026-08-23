---
title: "Creating a basic metronome using Web Audio API"
created: "Thurs, Aug 20 2026"
---

How do we schedule an audio sample every beat? This question was the primary problem in this simple project.

My first naive approach was to use `setTimeout`:
```js
function playMetronomeClick() {
    click(); // play audio sample
    setTimeout(playMetronomeClick, intervalBetweenClicks);
}

// Kick off the endless loop
playMetronomeClick();
```
This approach did not result in accurate timings at all. The problems were:
1. The intervals did not click at the expected interval lengths (even after triple-checking my math)
2. Clicks would speed up or slow down depending on if the browser was focused/visible/active or not

Callbacks resolve at indeterminate times in JavaScript (despite 'setting a timeout' via `setTimeout` suggesting otherwise). As a result, `setTimeout` alone cannot keep a reliable beat.

Try out this bad metronome below:

(TODO: Embed)

Luckily, we have the Web Audio API to save us.

The Web Audio API gives us access to a very precise `currentTime` which tracks the time since creating an `AudioContext` object. 

By using `setTimeout` as a window to schedule events rather than to play them directly, we can create a very precise, robust metronome!


Resources
- [MDN Web Audio API: Creating and Sequencing Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)
- [Chris Wilson: A Tale of Two Clocks (Audio Scheduling)](https://web.dev/articles/audio-scheduling)