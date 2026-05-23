/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts,md}'],
    theme: {
        extend: {
            colors: {
                spinpad: { DEFAULT: '#7C3AED', light: '#A78BFA', dark: '#4C1D95' },
            },
        },
    },
    plugins: [],
};
