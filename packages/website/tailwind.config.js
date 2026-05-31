/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts,md}'],
    theme: {
        extend: {
            colors: {
                spinpad: { DEFAULT: '#06B6D4', light: '#22D3EE', dark: '#0E7490' },
            },
        },
    },
    plugins: [],
};
