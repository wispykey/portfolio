<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>wispykey.com</title>
</svelte:head>

<nav>
	<ul>
		<li><a href="/">Home</a></li>
		<li><a href="/tools">Tools</a></li>
		<li><a href="/games">Games</a></li>
		<li><a href="/music">Music</a></li>
		<li><a href="/blog">Blog</a></li>
		<li><a href="/about">About</a></li>
	</ul>
</nav>

{@render children()}

<style>
	:root {
		font-family: "Noto Sans", "Gill Sans MT", Calibri, "Trebuchet MS",
			sans-serif;
	}

	ul {
		display: flex;
		gap: 1rem;
		justify-content: center;
		list-style: none;
		padding-left: 0;
	}

	a {
		text-decoration: none;
	}
</style>
