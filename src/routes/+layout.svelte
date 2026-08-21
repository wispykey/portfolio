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
		<!-- <li><a href="/games">Games</a></li> -->
		<li><a href="/music">Music</a></li>
		<li><a href="/blog">Blog</a></li>
		<li><a href="/about">About</a></li>
	</ul>
</nav>

<main>{@render children()}</main>

<style>
	:root {
		font-family: "Noto Sans", "Gill Sans MT", Calibri, "Trebuchet MS",
			sans-serif;

		box-sizing: border-box;
	}

	nav {
		padding: 0.5rem 1rem;
		font-size: 20px;
	}

	ul {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		padding: 0;
	}

	a {
		text-decoration: none;
	}

	main {
		padding: 0.5rem 2rem;
	}
</style>
