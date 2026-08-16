<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>wispykey.com</title>
</svelte:head>

<nav>
	<a href="/">Home</a>
	<a href="/about">About</a>
	<a href="/tools">Tools</a>
	<a href="/games">Games</a>
	<a href="/music">Music</a>
</nav>

{@render children()}
