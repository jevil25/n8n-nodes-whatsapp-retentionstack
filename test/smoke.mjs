// Smallest check that fails if the package is mis-wired: loads what n8n would load
// and cross-checks every operation against openapi.json when it is available.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

for (const p of [...pkg.n8n.credentials, ...pkg.n8n.nodes]) assert(existsSync(new URL(`../${p}`, import.meta.url)), `missing ${p}`);

const { WhatsAppRetentionStackApi } = require('../dist/credentials/WhatsAppRetentionStackApi.credentials.js');
const { WhatsAppRetentionStack } = require('../dist/nodes/WhatsAppRetentionStack/WhatsAppRetentionStack.node.js');
const { WhatsAppRetentionStackTrigger } = require('../dist/nodes/WhatsAppRetentionStack/WhatsAppRetentionStackTrigger.node.js');

const cred = new WhatsAppRetentionStackApi();
assert.equal(cred.authenticate.properties.headers['x-rapidapi-host'], 'whatsapp-messaging-bot.p.rapidapi.com');

const node = new WhatsAppRetentionStack().description;
assert.equal(node.credentials[0].name, cred.name, 'node must reference the credential by name');
assert(existsSync(new URL('../dist/nodes/WhatsAppRetentionStack/whatsapp.svg', import.meta.url)), 'icon not copied to dist');

// every operation has a request route; every displayOptions points at a real resource/operation
const resources = new Set(node.properties.find((p) => p.name === 'resource').options.map((o) => o.value));
const opsByResource = {};
const routes = [];
for (const p of node.properties.filter((p) => p.name === 'operation')) {
	const r = p.displayOptions.show.resource[0];
	assert(resources.has(r), `operation list for unknown resource ${r}`);
	opsByResource[r] = new Set(p.options.map((o) => o.value));
	for (const o of p.options) {
		assert(o.routing?.request?.url, `${r}.${o.value} has no request routing`);
		routes.push(`${o.routing.request.method} ${o.routing.request.url.replace(/^=/, '').replace(/\{\{\$parameter\.(\w+)\}\}/g, '{$1}')}`);
	}
}
for (const p of node.properties) {
	const s = p.displayOptions?.show;
	if (!s) continue;
	for (const o of s.operation ?? []) assert(opsByResource[s.resource[0]].has(o), `${p.name} shows for unknown operation ${s.resource[0]}.${o}`);
}
assert(routes.length >= 55, `expected full coverage, got ${routes.length} operations`);

// compare with the API spec when the sibling repo is present
const spec = new URL('../../wp-rapidapi/openapi.json', import.meta.url);
if (existsSync(spec)) {
	const paths = JSON.parse(readFileSync(spec, 'utf8')).paths;
	const specRoutes = new Set();
	for (const [p, methods] of Object.entries(paths)) for (const m of Object.keys(methods)) specRoutes.add(`${m.toUpperCase()} ${p}`);
	const skip = new Set(['GET /health', 'POST /v1/sessions', 'POST /v1/sessions/{session}/webhooks', 'DELETE /v1/sessions/{session}/webhooks']);
	for (const p of node.properties.filter((p) => p.name === 'operation'))
		for (const o of p.options) {
			const [, path] = o.description.split(' ');
			assert.equal(o.action, paths[path][o.routing.request.method.toLowerCase()].summary, `${o.value} action text must match the API docs summary`);
		}
	const missing = [...specRoutes].filter((r) => !skip.has(r) && !routes.includes(r));
	const unknown = routes.filter((r) => !specRoutes.has(r));
	assert.deepEqual(missing, [], `endpoints in openapi.json not covered by the node`);
	assert.deepEqual(unknown, [], `node routes not in openapi.json`);
}

// QR binary option must produce binary output
const fmt = node.properties.find((p) => p.name === 'format');
assert.equal(fmt.options.find((o) => o.value === 'binary').routing.output.postReceive[0].type, 'binaryData');

const trig = new WhatsAppRetentionStackTrigger();
assert.equal(trig.description.webhooks[0].httpMethod, 'POST');
assert.deepEqual(Object.keys(trig.webhookMethods.default).sort(), ['checkExists', 'create', 'delete']);

console.log(`smoke ok: ${routes.length} operations, all matched against openapi.json`);
