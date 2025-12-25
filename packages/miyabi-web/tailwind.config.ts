import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ive-style grayscale palette
        background: '#fafafa',
        foreground: '#171717',
        muted: '#737373',
        border: '#e5e5e5',
        accent: '#3b82f6',
      },
    },
  },
  plugins: [],
};

export default config;
