import type {
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { BASE_URL } from '../../credentials/WhatsAppRetentionStackApi.credentials';

const EVENTS = [
	{ name: 'Message Received', value: 'message', description: 'A new incoming message' },
	{ name: 'Any Message', value: 'message.any', description: 'Incoming and outgoing messages' },
	{ name: 'Message Ack', value: 'message.ack', description: 'Sent, delivered or read receipt' },
	{ name: 'Message Reaction', value: 'message.reaction' },
	{ name: 'Message Edited', value: 'message.edited' },
	{ name: 'Message Revoked', value: 'message.revoked' },
	{ name: 'Group Join', value: 'group.join' },
	{ name: 'Group Leave', value: 'group.leave' },
	{ name: 'Session Status', value: 'session.status', description: 'Session connected, disconnected, etc.' },
];

export class WhatsAppRetentionStackTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsApp by Retention Stack Trigger',
		name: 'whatsAppRetentionStackTrigger',
		icon: 'file:whatsapp.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{ $parameter["events"].join(", ") }}',
		description: 'Starts the workflow when a WhatsApp message or event arrives',
		defaults: { name: 'WhatsApp Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'whatsAppRetentionStackApi', required: true }],
		webhooks: [{ name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'webhook' }],
		properties: [
			{
				displayName: 'Session',
				name: 'session',
				type: 'string',
				default: 'default',
				required: true,
				description: 'Name of the connected WhatsApp session to listen on',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: EVENTS,
				default: ['message'],
				required: true,
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const url = this.getNodeWebhookUrl('default') as string;
				const session = this.getNodeParameter('session') as string;
				try {
					const res = await this.helpers.httpRequestWithAuthentication.call(this, 'whatsAppRetentionStackApi', {
						method: 'GET',
						url: `${BASE_URL}/v1/sessions/${encodeURIComponent(session)}`,
						json: true,
					});
					return JSON.stringify(res).includes(url);
				} catch {
					return false;
				}
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const url = this.getNodeWebhookUrl('default') as string;
				const session = this.getNodeParameter('session') as string;
				const events = this.getNodeParameter('events') as string[];
				await this.helpers.httpRequestWithAuthentication.call(this, 'whatsAppRetentionStackApi', {
					method: 'POST',
					url: `${BASE_URL}/v1/sessions/${encodeURIComponent(session)}/webhooks`,
					body: { webhookUrl: url, events },
					json: true,
				});
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const url = this.getNodeWebhookUrl('default') as string;
				const session = this.getNodeParameter('session') as string;
				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'whatsAppRetentionStackApi', {
						method: 'DELETE',
						url: `${BASE_URL}/v1/sessions/${encodeURIComponent(session)}/webhooks`,
						body: { webhookUrl: url },
						json: true,
					});
				} catch {
					// webhook already gone; nothing to clean up
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		return { workflowData: [this.helpers.returnJsonArray(this.getBodyData())] };
	}
}
