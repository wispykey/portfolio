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

<div class="main-container">
	<main>{@render children()}</main>
</div>

<style>
	@import "./cormeau-reset.css";
	@import "./global-styles.css";

	:root {
		font-family: "Noto Sans", "Gill Sans MT", Calibri, "Trebuchet MS",
			sans-serif;
	}

	nav {
		padding: 1rem;
		font-size: 20px;
	}

	ul {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		list-style: none;
		padding: 0;
	}

	a {
		text-decoration: none;
	}

	main {
		padding: 0.5rem 2rem;
		/* TODO: Responsive widths */
		width: 1000px;
	}

	.main-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>
