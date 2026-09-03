import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export const BASE_URL = 'https://whatsapp-messaging-bot.p.rapidapi.com';
export const RAPIDAPI_HOST = 'whatsapp-messaging-bot.p.rapidapi.com';

export class WhatsAppRetentionStackApi implements ICredentialType {
	name = 'whatsAppRetentionStackApi';
	displayName = 'WhatsApp by Retention Stack API';
	documentationUrl = 'https://whatsapp-messaging.retentionstack.agency/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'RapidAPI Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Your X-RapidAPI-Key. Subscribe (free plan, no credit card) at rapidapi.com/jevil257/api/whatsapp-messaging-bot.',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-rapidapi-key': '={{$credentials.apiKey}}',
				'x-rapidapi-host': RAPIDAPI_HOST,
			},
		},
	};
	test: ICredentialTestRequest = {
		request: { baseURL: BASE_URL, url: '/v1/sessions' },
	};
}
