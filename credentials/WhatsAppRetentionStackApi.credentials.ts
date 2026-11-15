import type { Icon, IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export const BASE_URL = 'https://wp-rapidapi.retentionstack.agency';

export class WhatsAppRetentionStackApi implements ICredentialType {
	name = 'whatsAppRetentionStackApi';
	displayName = 'WhatsApp by Retention Stack API';
	icon: Icon = { light: 'file:whatsapp.svg', dark: 'file:whatsapp.dark.svg' };
	documentationUrl = 'https://whatsapp-messaging.retentionstack.agency/docs/guides/authentication';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'A session token (ch_live_...) for one number, or an account key (ak_live_...) for every number. Get both at whatsapp-messaging.retentionstack.agency/app.',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
	test: ICredentialTestRequest = {
		request: { baseURL: BASE_URL, url: '/v1/sessions' },
	};
}
