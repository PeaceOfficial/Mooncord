import definePlugin from "@utils/types";

export default definePlugin({
	name: "2FaOnServers",
	description: "never get bothered about 2fa moderation again on servers!",
	authors: [
		{
			id: 1003477997728313405n,
			name: "Death",
		},
	],
	patches: [
		{
			find: "APPLICATION_SUBSCRIPTION_EXPIRATION:",
			replacement: [{
				match: /GUILD_MFA_WARNING:return/,
				replace: `GUILD_MFA_WARNING:return;return`
			}]
		}
	]
});