// Mirrors the ESLint config that @n8n/scan-community-package runs at the
// verification gate (see its scanner.mjs `buildScanConfig`), so violations
// surface on `npm test` instead of after a publish. Keep the `off` overrides
// in sync with the scanner — they exist there for good reasons.
import { defineConfig } from 'eslint/config';
import { n8nCommunityNodesPlugin } from '@n8n/eslint-plugin-community-nodes';
import n8nNodesPlugin from 'eslint-plugin-n8n-nodes-base';
import * as tsParser from '@typescript-eslint/parser';

const parser = tsParser.default ?? tsParser;

export default defineConfig(
	{ ignores: ['dist/**', 'node_modules/**'] },
	n8nCommunityNodesPlugin.configs.recommended,
	{ rules: { 'no-console': 'error' } },
	{ plugins: { 'n8n-nodes-base': n8nNodesPlugin } },
	{
		files: ['package.json'],
		rules: { ...n8nNodesPlugin.configs.community.rules },
	},
	{
		files: ['**/credentials/**/*.ts'],
		rules: {
			...n8nNodesPlugin.configs.credentials.rules,
			// Not valid for community nodes
			'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			// community-nodes' credential-password-field rule is more accurate
			'n8n-nodes-base/cred-class-field-type-options-password-missing': 'off',
		},
	},
	{
		files: ['**/nodes/**/*.ts'],
		rules: {
			...n8nNodesPlugin.configs.nodes.rules,
			// Inputs and outputs can be an enum instead of the string "main"
			'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'off',
			'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
			// Some third-party APIs do have a maximum, so maxValue is valid
			'n8n-nodes-base/node-param-type-options-max-value-present': 'off',
		},
	},
	{ files: ['**/*.json'], languageOptions: { parser } },
	{ files: ['**/*.ts'], languageOptions: { parser } },
);
