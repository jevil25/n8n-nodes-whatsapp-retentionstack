import type { Icon, INodeProperties, INodePropertyOptions, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes, UserError } from 'n8n-workflow';
import { BASE_URL } from '../../credentials/WhatsAppRetentionStackApi.credentials';
import { ENDPOINTS } from './endpoints';

// Declarative (routing) node covering every endpoint in openapi.json.
// Each operation is one `op(...)` line; each field maps onto the request body, query or path.

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
const S = '{{$parameter.session}}';
const G = `/v1/sessions/${S}/groups/{{$parameter.groupId}}`;
const C = `/v1/sessions/${S}/channels/{{$parameter.channelId}}`;

// Dropdown label follows n8n conventions ("Get Many"); action text is the API docs name
// (searchable in the node picker) and the description is the endpoint (shown as tooltip).
const op = (name: string, value: string, method: Method, url: string): INodePropertyOptions => {
	const route = `${method} ${url.replace(/\{\{\$parameter\.(\w+)\}\}/g, '{$1}')}`;
	const action = ENDPOINTS[route];
	if (!action) throw new UserError(`No summary in openapi.json for ${route}; run npm run gen`);
	return { name, value, action, description: route, routing: { request: { method, url: url.includes('{{') ? `=${url}` : url } } };
};

const show = (resource: string, operation?: string[]) => ({
	displayOptions: { show: { resource: [resource], ...(operation ? { operation } : {}) } },
});
const body = (property: string) => ({ routing: { send: { type: 'body' as const, property } } });
const query = (property: string) => ({ routing: { send: { type: 'query' as const, property } } });
// comma-separated text → array; `ids` wraps each as {id: "<number>@c.us"} for participant endpoints
const CSV = '$value.split(",").map(s => s.trim()).filter(Boolean)';
const csv = (property: string, ids = false) => ({
	routing: {
		send: {
			type: 'body' as const,
			property,
			value: ids ? `={{ ${CSV}.map(id => ({ id: id.includes("@") ? id : id + "@c.us" })) }}` : `={{ ${CSV} }}`,
		},
	},
});

const operation = (resource: string, options: INodePropertyOptions[], def: string): INodeProperties => ({
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	...show(resource),
	options,
	default: def,
});

const str = (displayName: string, name: string, resource: string, ops: string[] | undefined, extra: Partial<INodeProperties> = {}): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	...show(resource, ops),
	...extra,
});

const session = (resource: string, ops?: string[], routing: object = {}): INodeProperties =>
	str('Session', 'session', resource, ops, { default: 'default', required: true, description: 'Name of the connected WhatsApp session (the number you paired)', ...routing });

const chatId = (resource: string, ops: string[], routing: object = body('chatId')): INodeProperties =>
	str('Chat ID', 'chatId', resource, ops, { required: true, placeholder: '1234567890', description: 'Phone number with country code (no +), or a group/channel ID', ...routing });

const groupId = (ops: string[]): INodeProperties => str('Group ID', 'groupId', 'group', ops, { required: true, placeholder: '120363012345678901@g.us' });

const extra = (resource: string, ops: string[], options: INodeProperties[]): INodeProperties => ({
	displayName: 'Additional Fields',
	name: 'additionalFields',
	type: 'collection',
	placeholder: 'Add Field',
	default: {},
	...show(resource, ops),
	options,
});

const replyTo: INodeProperties = { displayName: 'Reply To Message ID', name: 'reply_to', type: 'string', default: '', ...body('reply_to') };
const mentions: INodeProperties = { displayName: 'Mentions', name: 'mentions', type: 'string', default: '', description: 'Comma-separated contact IDs to mention', ...csv('mentions') };

// ── Message ──────────────────────────────────────────────────────────────
const MEDIA = ['sendImage', 'sendFile', 'sendVideo', 'sendVoice'];
const MSG_BODY_SESSION = ['sendText', ...MEDIA, 'sendLocation', 'sendContactVcard', 'sendPoll', 'reply', 'reaction', 'star', 'sendSeen', 'startTyping', 'stopTyping'];

const message: INodeProperties[] = [
	operation(
		'message',
		[
			op('Get Many', 'getMany', 'GET', '/v1/messages'),
			op('Mark as Seen', 'sendSeen', 'POST', '/v1/sendSeen'),
			op('React', 'reaction', 'PUT', '/v1/reaction'),
			op('Reply', 'reply', 'POST', '/v1/reply'),
			op('Send Contact', 'sendContactVcard', 'POST', '/v1/sendContactVcard'),
			op('Send File', 'sendFile', 'POST', '/v1/sendFile'),
			op('Send Image', 'sendImage', 'POST', '/v1/sendImage'),
			op('Send Location', 'sendLocation', 'POST', '/v1/sendLocation'),
			op('Send Poll', 'sendPoll', 'POST', '/v1/sendPoll'),
			op('Send Text', 'sendText', 'POST', '/v1/sendText'),
			op('Send Video', 'sendVideo', 'POST', '/v1/sendVideo'),
			op('Send Voice', 'sendVoice', 'POST', '/v1/sendVoice'),
			op('Star', 'star', 'PUT', '/v1/star'),
			op('Start Typing', 'startTyping', 'POST', '/v1/startTyping'),
			op('Stop Typing', 'stopTyping', 'POST', '/v1/stopTyping'),
		],
		'sendText',
	),
	session('message', MSG_BODY_SESSION, body('session')),
	session('message', ['getMany'], query('session')),
	chatId('message', ['sendText', ...MEDIA, 'sendLocation', 'sendContactVcard', 'sendPoll', 'reply', 'sendSeen', 'startTyping', 'stopTyping']),
	chatId('message', ['getMany'], query('chatId')),
	str('Text', 'text', 'message', ['sendText', 'reply'], { required: true, typeOptions: { rows: 3 }, ...body('text') }),
	str('Reply To Message ID', 'replyTo', 'message', ['reply'], { required: true, ...body('reply_to') }),
	str('Message ID', 'messageId', 'message', ['reaction', 'star'], { required: true, ...body('messageId') }),
	str('Reaction', 'reaction', 'message', ['reaction'], { required: true, placeholder: '👍', description: 'Emoji to react with. Leave empty to remove the reaction.', ...body('reaction') }),
	{ displayName: 'Star', name: 'star', type: 'boolean', default: true, ...show('message', ['star']), ...body('star') },

	// media
	{
		displayName: 'File Source',
		name: 'fileSource',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
		],
		default: 'url',
		...show('message', MEDIA),
	},
	str('File URL', 'fileUrl', 'message', MEDIA, {
		required: true,
		placeholder: 'https://example.com/photo.jpg',
		description: 'Public URL the API downloads the file from',
		displayOptions: { show: { resource: ['message'], operation: MEDIA, fileSource: ['url'] } },
		...body('file.url'),
	}),
	str('File Data (Base64)', 'fileData', 'message', MEDIA, {
		required: true,
		description: 'Base64-encoded file contents',
		displayOptions: { show: { resource: ['message'], operation: MEDIA, fileSource: ['base64'] } },
		...body('file.data'),
	}),
	str('MIME Type', 'mimetype', 'message', MEDIA, {
		required: true,
		placeholder: 'image/jpeg',
		displayOptions: { show: { resource: ['message'], operation: MEDIA, fileSource: ['base64'] } },
		...body('file.mimetype'),
	}),
	str('Caption', 'caption', 'message', ['sendImage', 'sendFile', 'sendVideo'], body('caption')),

	// location / contact / poll
	{ displayName: 'Latitude', name: 'latitude', type: 'number', default: 0, required: true, ...show('message', ['sendLocation']), ...body('latitude') },
	{ displayName: 'Longitude', name: 'longitude', type: 'number', default: 0, required: true, ...show('message', ['sendLocation']), ...body('longitude') },
	str('Contact IDs', 'contactsId', 'message', ['sendContactVcard'], { required: true, placeholder: '1234567890@c.us, 0987654321@c.us', description: 'Comma-separated contact IDs to share as vCards', ...csv('contactsId') }),
	str('Question', 'pollName', 'message', ['sendPoll'], { required: true, ...body('poll.name') }),
	str('Options', 'pollOptions', 'message', ['sendPoll'], { required: true, placeholder: 'Yes, No, Maybe', description: 'Comma-separated poll options (2 to 12)', ...csv('poll.options') }),
	{ displayName: 'Allow Multiple Answers', name: 'multipleAnswers', type: 'boolean', default: false, ...show('message', ['sendPoll']), ...body('poll.multipleAnswers') },

	// get many
	{ displayName: 'Limit', name: 'limit', type: 'number', default: 50, typeOptions: { minValue: 1 }, description: 'Max number of results to return', ...show('message', ['getMany']), ...query('limit') },
	{ displayName: 'Download Media', name: 'downloadMedia', type: 'boolean', default: false, ...show('message', ['getMany']), ...query('downloadMedia') },

	// additional fields, scoped so nothing unsupported is sent
	extra('message', ['sendText'], [
		{ displayName: 'Link Preview', name: 'linkPreview', type: 'boolean', default: true, ...body('linkPreview') },
		{ displayName: 'Link Preview High Quality', name: 'linkPreviewHighQuality', type: 'boolean', default: false, ...body('linkPreviewHighQuality') },
		mentions,
		replyTo,
	]),
	extra('message', ['sendImage', 'sendFile', 'sendVideo'], [
		{ displayName: 'Filename', name: 'filename', type: 'string', default: '', ...body('file.filename') },
		mentions,
		{ displayName: 'MIME Type', name: 'mimetypeUrl', type: 'string', default: '', placeholder: 'image/jpeg', ...body('file.mimetype') },
		replyTo,
	]),
	extra('message', ['sendVoice'], [
		{ displayName: 'Filename', name: 'filename', type: 'string', default: '', ...body('file.filename') },
		{ displayName: 'MIME Type', name: 'mimetypeUrl', type: 'string', default: '', placeholder: 'audio/ogg; codecs=opus', ...body('file.mimetype') },
		replyTo,
	]),
	extra('message', ['sendLocation'], [replyTo, { displayName: 'Title', name: 'title', type: 'string', default: '', ...body('title') }]),
	extra('message', ['sendContactVcard', 'sendPoll'], [replyTo]),
	extra('message', ['reply'], [mentions]),
	extra('message', ['sendSeen'], [{ displayName: 'Message ID', name: 'messageId', type: 'string', default: '', ...body('messageId') }]),
];

// ── Session ──────────────────────────────────────────────────────────────
const PRESENCE_CHAT = `/v1/sessions/${S}/presence/{{$parameter.chatId}}`;
const sessionProps: INodeProperties[] = [
	operation(
		'session',
		[
			op('Delete', 'delete', 'DELETE', `/v1/sessions/${S}`),
			op('Get', 'get', 'GET', `/v1/sessions/${S}`),
			op('Get Chat Presence', 'getChatPresence', 'GET', PRESENCE_CHAT),
			op('Get Many', 'getMany', 'GET', '/v1/sessions'),
			op('Get Me', 'me', 'GET', `/v1/sessions/${S}/me`),
			op('Get Presence', 'getPresence', 'GET', `/v1/sessions/${S}/presence`),
			op('Get QR Code', 'qr', 'GET', `/v1/${S}/auth/qr`),
			op('Logout', 'logout', 'POST', '/v1/sessions/logout'),
			op('Request Pairing Code', 'pairingCode', 'POST', `/v1/${S}/auth/pairing-code`),
			op('Set Presence', 'setPresence', 'POST', `/v1/sessions/${S}/presence`),
			op('Start', 'start', 'POST', '/v1/sessions/start'),
			op('Stop', 'stop', 'POST', '/v1/sessions/stop'),
			op('Subscribe Chat Presence', 'subscribePresence', 'POST', `${PRESENCE_CHAT}/subscribe`),
		],
		'get',
	),
	session('session', ['delete', 'get', 'getChatPresence', 'me', 'getPresence', 'qr', 'pairingCode', 'subscribePresence']),
	session('session', ['start', 'stop', 'logout'], body('name')),
	session('session', ['setPresence'], body('session')),
	chatId('session', ['getChatPresence', 'subscribePresence'], {}),
	{ displayName: 'Logout', name: 'logout', type: 'boolean', default: false, description: 'Whether to also log out (unpair) when stopping', ...show('session', ['stop']), ...body('logout') },
	str('Phone Number', 'phoneNumber', 'session', ['pairingCode'], { required: true, placeholder: '1234567890', description: 'Number to pair, with country code', ...body('phoneNumber') }),
	{
		displayName: 'Presence',
		name: 'presence',
		type: 'options',
		options: ['online', 'offline', 'typing', 'recording', 'paused'].map((v) => ({ name: v[0].toUpperCase() + v.slice(1), value: v })),
		default: 'online',
		...show('session', ['setPresence']),
		...body('presence'),
	},
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		options: [
			{ name: 'Base64 (JSON)', value: 'base64', routing: { request: { qs: { format: 'base64' } } } },
			{
				name: 'Binary (PNG File)',
				value: 'binary',
				routing: {
					request: { qs: { format: 'binary' }, encoding: 'arraybuffer', returnFullResponse: true },
					output: { postReceive: [{ type: 'binaryData', properties: { destinationProperty: 'data' } }] },
				},
			},
		],
		default: 'base64',
		...show('session', ['qr']),
	},
];

// ── Group ────────────────────────────────────────────────────────────────
const PARTICIPANT_OPS = ['addParticipants', 'removeParticipants', 'promote', 'demote'];
const GROUP_ID_OPS = ['get', 'delete', 'leave', 'setSubject', 'setDescription', 'setInfoAdminOnly', 'getInfoAdminOnly', 'setMessagesAdminOnly', 'getMessagesAdminOnly', 'getParticipants', ...PARTICIPANT_OPS, 'getInviteCode', 'revokeInviteCode', 'getPicture', 'setPicture', 'deletePicture'];
const group: INodeProperties[] = [
	operation(
		'group',
		[
			op('Add Participants', 'addParticipants', 'POST', `${G}/participants/add`),
			op('Count', 'count', 'GET', `/v1/sessions/${S}/groups/count`),
			op('Create', 'create', 'POST', `/v1/sessions/${S}/groups`),
			op('Delete', 'delete', 'DELETE', G),
			op('Delete Picture', 'deletePicture', 'DELETE', `${G}/picture`),
			op('Demote From Admin', 'demote', 'POST', `${G}/admin/demote`),
			op('Get', 'get', 'GET', G),
			op('Get Info Admin Only', 'getInfoAdminOnly', 'GET', `${G}/settings/security/info-admin-only`),
			op('Get Invite Code', 'getInviteCode', 'GET', `${G}/invite-code`),
			op('Get Many', 'getMany', 'GET', `/v1/sessions/${S}/groups`),
			op('Get Messages Admin Only', 'getMessagesAdminOnly', 'GET', `${G}/settings/security/messages-admin-only`),
			op('Get Participants', 'getParticipants', 'GET', `${G}/participants`),
			op('Get Picture', 'getPicture', 'GET', `${G}/picture`),
			op('Join', 'join', 'POST', `/v1/sessions/${S}/groups/join`),
			op('Leave', 'leave', 'POST', `${G}/leave`),
			op('Promote to Admin', 'promote', 'POST', `${G}/admin/promote`),
			op('Refresh', 'refresh', 'POST', `/v1/sessions/${S}/groups/refresh`),
			op('Remove Participants', 'removeParticipants', 'POST', `${G}/participants/remove`),
			op('Revoke Invite Code', 'revokeInviteCode', 'POST', `${G}/invite-code/revoke`),
			op('Set Description', 'setDescription', 'PUT', `${G}/description`),
			op('Set Info Admin Only', 'setInfoAdminOnly', 'PUT', `${G}/settings/security/info-admin-only`),
			op('Set Messages Admin Only', 'setMessagesAdminOnly', 'PUT', `${G}/settings/security/messages-admin-only`),
			op('Set Picture', 'setPicture', 'PUT', `${G}/picture`),
			op('Set Subject', 'setSubject', 'PUT', `${G}/subject`),
		],
		'create',
	),
	session('group'),
	groupId(GROUP_ID_OPS),
	str('Group Name', 'name', 'group', ['create'], { required: true, ...body('name') }),
	str('Participants', 'participants', 'group', ['create', ...PARTICIPANT_OPS], { required: true, placeholder: '1234567890, 0987654321', description: 'Comma-separated phone numbers or contact IDs', ...csv('participants', true) }),
	str('Description', 'description', 'group', ['create'], body('description')),
	str('Description', 'descriptionSet', 'group', ['setDescription'], { required: true, ...body('description') }),
	str('Subject', 'subject', 'group', ['setSubject'], { required: true, ...body('subject') }),
	str('Invite Code', 'code', 'group', ['join'], { required: true, placeholder: 'AbCdEfGhIjK', description: 'The code from a chat.whatsapp.com invite link', ...body('code') }),
	{ displayName: 'Admins Only', name: 'adminsOnly', type: 'boolean', default: true, ...show('group', ['setInfoAdminOnly', 'setMessagesAdminOnly']), ...body('adminsOnly') },
	str('Picture URL', 'pictureUrl', 'group', ['setPicture'], { required: true, placeholder: 'https://example.com/logo.jpg', ...body('file.url') }),
	str('MIME Type', 'pictureMimetype', 'group', ['setPicture'], { placeholder: 'image/jpeg', ...body('file.mimetype') }),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		...show('group', ['getMany']),
		options: [
			{ displayName: 'Limit', name: 'limit', type: 'number', default: 50, typeOptions: { minValue: 1 }, description: 'Max number of results to return', ...query('limit') },
			{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, ...query('offset') },
			{ displayName: 'Sort By', name: 'sortBy', type: 'options', options: [{ name: 'ID', value: 'id' }, { name: 'Subject', value: 'subject' }], default: 'subject', ...query('sortBy') },
			{ displayName: 'Sort Order', name: 'sortOrder', type: 'options', options: [{ name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' }], default: 'asc', ...query('sortOrder') },
		],
	},
];

// ── Channel ──────────────────────────────────────────────────────────────
const channel: INodeProperties[] = [
	operation(
		'channel',
		[
			op('Create', 'create', 'POST', `/v1/sessions/${S}/channels`),
			op('Delete', 'delete', 'DELETE', C),
			op('Get', 'get', 'GET', C),
			op('Get Many', 'getMany', 'GET', `/v1/sessions/${S}/channels`),
			op('Get Preview Messages', 'preview', 'GET', `${C}/messages/preview`),
		],
		'getMany',
	),
	session('channel'),
	str('Channel ID', 'channelId', 'channel', ['get', 'delete', 'preview'], { required: true, placeholder: '120363012345678901@newsletter' }),
	str('Name', 'name', 'channel', ['create'], { required: true, ...body('name') }),
	str('Description', 'description', 'channel', ['create'], body('description')),
	str('Picture URL', 'pictureUrl', 'channel', ['create'], { placeholder: 'https://example.com/logo.jpg', ...body('picture.url') }),
	str('Picture MIME Type', 'pictureMimetype', 'channel', ['create'], { placeholder: 'image/jpeg', ...body('picture.mimetype') }),
	{ displayName: 'Limit', name: 'limit', type: 'number', default: 50, typeOptions: { minValue: 1 }, description: 'Max number of results to return', ...show('channel', ['preview']), ...query('limit') },
	{ displayName: 'Download Media', name: 'downloadMedia', type: 'boolean', default: false, ...show('channel', ['preview']), ...query('downloadMedia') },
];

// ── Contact ──────────────────────────────────────────────────────────────
const contact: INodeProperties[] = [
	operation('contact', [op('Check Exists', 'checkExists', 'GET', '/v1/contacts/check-exists')], 'checkExists'),
	session('contact', undefined, query('session')),
	str('Phone Number', 'phone', 'contact', ['checkExists'], { required: true, placeholder: '1234567890', ...query('phone') }),
];

export class WhatsAppRetentionStack implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsApp by Retention Stack',
		name: 'whatsAppRetentionStack',
		icon: { light: 'file:whatsapp.svg', dark: 'file:whatsapp.dark.svg' } as Icon,
		group: ['output'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Send WhatsApp messages, images, files and OTPs via the Retention Stack REST API. No Meta approval needed.',
		defaults: { name: 'WhatsApp' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'whatsAppRetentionStackApi', required: true }],
		requestDefaults: {
			baseURL: BASE_URL,
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Channel', value: 'channel' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Group', value: 'group' },
					{ name: 'Message', value: 'message' },
					{ name: 'Session', value: 'session' },
				],
				default: 'message',
			},
			...message,
			...sessionProps,
			...group,
			...channel,
			...contact,
		],
	};
}
