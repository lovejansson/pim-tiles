import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig}*/
export default {
    // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
    // for more information about preprocessors
    preprocess: [vitePreprocess()],
    // Add svelte-check options here
    onwarn: (warning, handler) => {
        // optional: suppress certain warnings
        if (IGNORE_SVELTE_A11Y.includes(warning.code)) return;
        handler(warning);
    },
};

// Shoelace's components are considered static from svelte's perspective even if it is a sl-button, so I disabled these warnings. 
const IGNORE_SVELTE_A11Y = ["a11y_no_static_element_interactions", "a11y_click_events_have_key_events"];