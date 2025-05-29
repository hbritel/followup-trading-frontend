
import type { Config } from "tailwindcss";
import plugin from 'tailwindcss/plugin';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))', // Utilisé pour les focus, sera basé sur la couleur primaire
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					// Définir la couleur primaire via variable CSS --primary
					// La couleur réelle sera définie par les classes 'theme-*'
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: { // Garder 'accent' pour les états hover/selected non liés à la couleur primaire
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				profit: {
					light: '#e6f7ef',
					DEFAULT: '#10b981',
					dark: '#059669'
				},
				loss: {
					light: '#fee2e2',
					DEFAULT: '#ef4444',
					dark: '#b91c1c'
				},
				neutral: {
					light: '#f5f5f5',
					DEFAULT: '#737373',
					dark: '#404040'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
                'fade-in': {
                    '0%': {
                        opacity: '0'
                    },
                    '100%': {
                        opacity: '1'
                    }
                },
                'slide-up': {
                    '0%': {
                        transform: 'translateY(10px)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateY(0)',
                        opacity: '1'
                    }
                },
                'slide-down': {
                    '0%': {
                        transform: 'translateY(-10px)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateY(0)',
                        opacity: '1'
                    }
                },
                'slide-in-right': {
                    '0%': {
                        transform: 'translateX(10px)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateX(0)',
                        opacity: '1'
                    }
                },
                'pulse-scale': {
                    '0%, 100%': {
                        transform: 'scale(1)'
                    },
                    '50%': {
                        transform: 'scale(1.05)'
                    }
                }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.4s ease-out',
                'slide-up': 'slide-up 0.4s ease-out',
                'slide-down': 'slide-down 0.4s ease-out',
                'slide-in-right': 'slide-in-right 0.4s ease-out',
                'pulse-scale': 'pulse-scale 2s ease-in-out infinite'
			},
            fontFamily: {
                sans: [
                    'SF Pro Display',
                    'Inter',
                    'system-ui',
                    'sans-serif'
                ],
                mono: [
                    'SF Mono',
                    'JetBrains Mono',
                    'monospace'
                ]
            }
		}
	},
	plugins: [
		tailwindcssAnimate,
		// Plugin personnalisé pour les thèmes de couleur et la densité
		plugin(function({ addBase, addUtilities, theme }) {
			addBase({
				':root': { // Thème par défaut (blue)
					'--background': '0 0% 100%',
					'--foreground': '224 71.4% 4.1%',
					'--card': '0 0% 100%',
					'--card-foreground': '224 71.4% 4.1%',
					'--popover': '0 0% 100%',
					'--popover-foreground': '224 71.4% 4.1%',
					'--primary': '221.2 83.2% 53.3%', // Blue HSL
					'--primary-foreground': '210 20% 98%',
					'--secondary': '220 14.3% 95.9%',
					'--secondary-foreground': '220.9 39.3% 11%',
					'--muted': '220 14.3% 95.9%',
					'--muted-foreground': '220 8.9% 46.1%',
					'--accent': '220 14.3% 95.9%',
					'--accent-foreground': '220.9 39.3% 11%',
					'--destructive': '0 84.2% 60.2%',
					'--destructive-foreground': '210 20% 98%',
					'--border': '220 13% 91%',
					'--input': '220 13% 91%',
					'--ring': '221.2 83.2% 53.3%', // Primary color par défaut pour ring
					'--radius': '0.5rem',
				},
				'.dark': { // Thème sombre par défaut (blue)
					'--background': '224 71.4% 4.1%',
					'--foreground': '210 20% 98%',
					'--card': '224 71.4% 4.1%',
					'--card-foreground': '210 20% 98%',
					'--popover': '224 71.4% 4.1%',
					'--popover-foreground': '210 20% 98%',
					'--primary': '217.2 91.2% 59.8%', // Blue clair pour sombre
					'--primary-foreground': '210 20% 98%', // Texte clair sur primaire
					'--secondary': '215 27.9% 16.9%',
					'--secondary-foreground': '210 20% 98%',
					'--muted': '215 27.9% 16.9%',
					'--muted-foreground': '217.9 10.6% 64.9%',
					'--accent': '215 27.9% 16.9%',
					'--accent-foreground': '210 20% 98%',
					'--destructive': '0 62.8% 30.6%',
					'--destructive-foreground': '210 20% 98%',
					'--border': '215 27.9% 16.9%',
					'--input': '215 27.9% 16.9%',
					'--ring': '217.2 91.2% 59.8%', // Primary color pour ring
				},
				// --- Définitions des thèmes de couleur ---
				// (Vous pouvez ajouter plus de thèmes ici)
				'.theme-blue': { '--primary': '221.2 83.2% 53.3%', '--ring': '221.2 83.2% 53.3%' },
				'.dark .theme-blue': { '--primary': '217.2 91.2% 59.8%', '--ring': '217.2 91.2% 59.8%' },

				'.theme-green': { '--primary': '142.1 76.2% 36.3%', '--primary-foreground': '144.9 80.4% 97.1%', '--ring': '142.1 76.2% 36.3%' },
				'.dark .theme-green': { '--primary': '142.1 70.6% 45.3%', '--primary-foreground': '144.9 80.4% 97.1%', '--ring': '142.1 70.6% 45.3%' },

				'.theme-purple': { '--primary': '262.1 83.3% 57.8%', '--primary-foreground': '210 20% 98%', '--ring': '262.1 83.3% 57.8%' },
				'.dark .theme-purple': { '--primary': '263.4 70% 50.4%', '--primary-foreground': '210 20% 98%', '--ring': '263.4 70% 50.4%' },

				'.theme-orange': { '--primary': '24.6 95% 53.1%', '--primary-foreground': '210 20% 98%', '--ring': '24.6 95% 53.1%' },
				'.dark .theme-orange': { '--primary': '20.5 90.2% 48.2%', '--primary-foreground': '210 20% 98%', '--ring': '20.5 90.2% 48.2%' },

				'.theme-red': { '--primary': '0 72.2% 50.6%', '--primary-foreground': '210 20% 98%', '--ring': '0 72.2% 50.6%' },
				'.dark .theme-red': { '--primary': '0 84.2% 60.2%', '--primary-foreground': '210 20% 98%', '--ring': '0 84.2% 60.2%' },
			});

			// --- Utilitaires pour la taille de police ---
			// Tailwind a déjà des classes text-xs, text-sm, text-base, text-lg etc.
			// On peut les utiliser directement. Si vous voulez des alias :
			addUtilities({
				'.font-size-small': { '@apply text-sm': {} },   // Ou text-xs si vous préférez
				'.font-size-medium': { '@apply text-base': {} }, // Taille par défaut
				'.font-size-large': { '@apply text-lg': {} },
			});

			// --- Utilitaires pour la densité ---
			// Cela peut être plus complexe, affectant padding, margin, line-height.
			// Solution simple : ajouter des classes et cibler des éléments spécifiques.
			// Exemple (à adapter à votre structure HTML et composants) :
			addUtilities({
				'.density-compact': {
					// Exemple : réduire le padding des Card, Buttons, etc.
					'.card-padding': { '@apply p-3': {} }, // Classe perso à mettre sur CardContent
					'.button-padding': { '@apply px-3 py-1': {} }, // Classe perso à mettre sur Button
					// Réduire line-height globalement ?
					'@apply leading-tight': {},
				},
				'.density-comfortable': { // Défaut
					'.card-padding': { '@apply p-6': {} },
					'.button-padding': { '@apply px-4 py-2': {} }, // Tailwind default md
					'@apply leading-normal': {},
				},
				'.density-spacious': {
					'.card-padding': { '@apply p-8': {} },
					'.button-padding': { '@apply px-6 py-3': {} }, // Tailwind default lg
					'@apply leading-relaxed': {},
				}
			})
		}),
	],
} satisfies Config;
