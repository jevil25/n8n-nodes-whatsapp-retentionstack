# n8n-nodes-whatsapp-retentionstack

n8n community nodes for the [WhatsApp Messaging API by Retention Stack](https://whatsapp-messaging.retentionstack.agency).
Send WhatsApp text, images, files, videos, locations and OTPs from any workflow, and trigger workflows on incoming messages.

No Meta approval queue. No WhatsApp Business account. 5 minutes from subscribe to first message.

## Nodes

**WhatsApp by Retention Stack** (action)

| Resource | Operations |
|---|---|
| Message | Send Text, Image, File, Video, Voice, Location, Contact, Poll · Reply · React · Star · Mark as Seen · Start/Stop Typing · Get Many |
| Session | Get, Get Many, Get Me, Start, Stop, Logout, Delete · Get QR Code (base64 or PNG binary) · Request Pairing Code · Set/Get Presence · Chat Presence |
| Group | Create, Get, Get Many, Count, Join, Leave, Delete, Refresh · Subject, Description, Picture · Participants add/remove, Promote/Demote admins · Admin-only settings · Invite code get/revoke |
| Channel | Create, Get, Get Many, Delete, Get Preview Messages |
| Contact | Check Exists |

Media can be sent from a public URL or as base64 data. Participant and contact lists take comma-separated phone numbers.

**WhatsApp by Retention Stack Trigger**

Fires on `message`, `message.any`, `message.ack`, `message.reaction`, `message.edited`, `message.revoked`, `group.join`, `group.leave`, `session.status`. The webhook is registered on activation and removed on deactivation.

## Node to API mapping

Dropdown labels follow n8n conventions (for example "Get Many"). The action text shown in the node picker is the name used in the [API docs](https://whatsapp-messaging.retentionstack.agency/docs), and each operation's tooltip shows the endpoint.

<!-- api-map:start -->
| Resource | Operation | API docs name | Endpoint |
|---|---|---|---|
| Message | Get Many | Get messages | `GET /v1/messages` |
| Message | Mark as Seen | Mark message as seen | `POST /v1/sendSeen` |
| Message | React | Set message reaction | `PUT /v1/reaction` |
| Message | Reply | Reply to message | `POST /v1/reply` |
| Message | Send Contact | Send contact vCard | `POST /v1/sendContactVcard` |
| Message | Send File | Send file | `POST /v1/sendFile` |
| Message | Send Image | Send image | `POST /v1/sendImage` |
| Message | Send Location | Send location | `POST /v1/sendLocation` |
| Message | Send Poll | Send poll | `POST /v1/sendPoll` |
| Message | Send Text | Send text message | `POST /v1/sendText` |
| Message | Send Video | Send video | `POST /v1/sendVideo` |
| Message | Send Voice | Send voice message | `POST /v1/sendVoice` |
| Message | Star | Star or unstar message | `PUT /v1/star` |
| Message | Start Typing | Start typing indicator | `POST /v1/startTyping` |
| Message | Stop Typing | Stop typing indicator | `POST /v1/stopTyping` |
| Session | Delete | Delete session | `DELETE /v1/sessions/{session}` |
| Session | Get | Get session | `GET /v1/sessions/{session}` |
| Session | Get Chat Presence | Get chat presence | `GET /v1/sessions/{session}/presence/{chatId}` |
| Session | Get Many | List sessions | `GET /v1/sessions` |
| Session | Get Me | Get session me | `GET /v1/sessions/{session}/me` |
| Session | Get Presence | Get all chats presence | `GET /v1/sessions/{session}/presence` |
| Session | Get QR Code | Get QR code | `GET /v1/{session}/auth/qr` |
| Session | Logout | Logout session | `POST /v1/sessions/logout` |
| Session | Request Pairing Code | Request pairing code | `POST /v1/{session}/auth/pairing-code` |
| Session | Set Presence | Set presence | `POST /v1/sessions/{session}/presence` |
| Session | Start | Start session | `POST /v1/sessions/start` |
| Session | Stop | Stop session | `POST /v1/sessions/stop` |
| Session | Subscribe Chat Presence | Subscribe to chat presence | `POST /v1/sessions/{session}/presence/{chatId}/subscribe` |
| Group | Add Participants | Add participants | `POST /v1/sessions/{session}/groups/{groupId}/participants/add` |
| Group | Count | Get groups count | `GET /v1/sessions/{session}/groups/count` |
| Group | Create | Create group | `POST /v1/sessions/{session}/groups` |
| Group | Delete | Delete group | `DELETE /v1/sessions/{session}/groups/{groupId}` |
| Group | Delete Picture | Delete group picture | `DELETE /v1/sessions/{session}/groups/{groupId}/picture` |
| Group | Demote From Admin | Demote from admin | `POST /v1/sessions/{session}/groups/{groupId}/admin/demote` |
| Group | Get | Get group | `GET /v1/sessions/{session}/groups/{groupId}` |
| Group | Get Info Admin Only | Get info admin-only setting | `GET /v1/sessions/{session}/groups/{groupId}/settings/security/info-admin-only` |
| Group | Get Invite Code | Get invite code | `GET /v1/sessions/{session}/groups/{groupId}/invite-code` |
| Group | Get Many | List groups (paginated, excludes participants) | `GET /v1/sessions/{session}/groups` |
| Group | Get Messages Admin Only | Get messages admin-only setting | `GET /v1/sessions/{session}/groups/{groupId}/settings/security/messages-admin-only` |
| Group | Get Participants | Get participants | `GET /v1/sessions/{session}/groups/{groupId}/participants` |
| Group | Get Picture | Get group picture | `GET /v1/sessions/{session}/groups/{groupId}/picture` |
| Group | Join | Join group | `POST /v1/sessions/{session}/groups/join` |
| Group | Leave | Leave group | `POST /v1/sessions/{session}/groups/{groupId}/leave` |
| Group | Promote to Admin | Promote to admin | `POST /v1/sessions/{session}/groups/{groupId}/admin/promote` |
| Group | Refresh | Refresh groups | `POST /v1/sessions/{session}/groups/refresh` |
| Group | Remove Participants | Remove participants | `POST /v1/sessions/{session}/groups/{groupId}/participants/remove` |
| Group | Revoke Invite Code | Revoke invite code | `POST /v1/sessions/{session}/groups/{groupId}/invite-code/revoke` |
| Group | Set Description | Set group description | `PUT /v1/sessions/{session}/groups/{groupId}/description` |
| Group | Set Info Admin Only | Set info admin-only | `PUT /v1/sessions/{session}/groups/{groupId}/settings/security/info-admin-only` |
| Group | Set Messages Admin Only | Set messages admin-only | `PUT /v1/sessions/{session}/groups/{groupId}/settings/security/messages-admin-only` |
| Group | Set Picture | Set group picture | `PUT /v1/sessions/{session}/groups/{groupId}/picture` |
| Group | Set Subject | Set group subject | `PUT /v1/sessions/{session}/groups/{groupId}/subject` |
| Channel | Create | Create channel | `POST /v1/sessions/{session}/channels` |
| Channel | Delete | Delete channel | `DELETE /v1/sessions/{session}/channels/{channelId}` |
| Channel | Get | Get channel | `GET /v1/sessions/{session}/channels/{channelId}` |
| Channel | Get Many | List channels | `GET /v1/sessions/{session}/channels` |
| Channel | Get Preview Messages | Get channel preview messages | `GET /v1/sessions/{session}/channels/{channelId}/messages/preview` |
| Contact | Check Exists | Check if phone number exists on WhatsApp | `GET /v1/contacts/check-exists` |
<!-- api-map:end -->

## Setup

1. Subscribe on RapidAPI (free plan, 100 requests/month, no credit card): [rapidapi.com/jevil257/api/whatsapp-messaging-bot](https://rapidapi.com/jevil257/api/whatsapp-messaging-bot). Copy your `X-RapidAPI-Key`.
2. Pair your phone once: run **Session → Start**, then **Session → Get QR Code** and scan it in WhatsApp → Linked Devices. Or follow the [getting started guide](https://whatsapp-messaging.retentionstack.agency/docs).
3. In n8n, add credentials **WhatsApp by Retention Stack API** and paste the key.
4. Drop the node into a workflow. Session name defaults to `default`.

## Install

**Self-hosted n8n:** Settings → Community Nodes → Install → `n8n-nodes-whatsapp-retentionstack`.

**Docker / manual:**

```bash
cd ~/.n8n/nodes && npm install n8n-nodes-whatsapp-retentionstack
```

## Example: send an OTP

Message → Send Text
- Chat ID: `{{ $json.phone }}`
- Text: `Your login code is {{ $json.otp }}. Valid for 5 minutes.`

## Development

```bash
npm install
npm test        # builds to dist/ and runs the smoke check
npm run gen     # regenerate endpoints.ts and the README table from ../wp-rapidapi/openapi.json
npm link        # then in ~/.n8n/nodes: npm link n8n-nodes-whatsapp-retentionstack
```

## Links

- API docs: https://whatsapp-messaging.retentionstack.agency/docs
- RapidAPI listing: https://rapidapi.com/jevil257/api/whatsapp-messaging-bot
- Issues: https://github.com/jevil25/n8n-nodes-whatsapp-retentionstack/issues

MIT © Retention Stack
