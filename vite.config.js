import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
	// Only used for the dev server below. Nothing from here is injected into the client bundle:
	// client code reads import.meta.env.VITE_* only.
	const env = loadEnv(mode, process.cwd(), ['VITE_', 'API_']);
	const proxyTarget = env.API_PROXY_TARGET || 'http://127.0.0.1:8000';
	const proxy = { target: proxyTarget, changeOrigin: true };

	return {
		plugins: [react()],
		server: {
			port: Number(env.VITE_PORT || 3000),
			proxy: {
				'/api': proxy,
				'/uploads': proxy,
			},
		},
	};
});
