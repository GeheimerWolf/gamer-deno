import { botCache } from "../../../mod.ts";
import {
  createCommandAliases,
  sendResponse,
} from "../../utils/helpers.ts";
import {
  botHasPermission,
  highestRole,
  higherRolePosition,
  Member,
  botID,
  ban,
  getBans,
  sendDirectMessage,
} from "../../../deps.ts";
import { PermissionLevels } from "../../types/commands.ts";

botCache.commands.set(`ban`, {
  name: `ban`,
  permissionLevels: [PermissionLevels.MODERATOR, PermissionLevels.ADMIN],
  botServerPermissions: ["BAN_MEMBERS"],
  arguments: [
    { name: "member", type: "member", required: false },
    { name: "userID", type: "string", required: false },
    { name: "reason", type: "...string" },
  ],
  guildOnly: true,
  execute: async function (message, args: BanArgs, guild) {
    if (!guild) return;

    if (args.member) {
      const botsHighestRole = highestRole(message.guildID, botID);
      const membersHighestRole = highestRole(
        message.guildID,
        args.member.user.id,
      );
      const modsHighestRole = highestRole(message.guildID, message.author.id);

      if (
        !botsHighestRole || !membersHighestRole ||
        !higherRolePosition(
          message.guildID,
          botsHighestRole.id,
          membersHighestRole.id,
        )
      ) {
        return botCache.helpers.reactError(message);
      }

      if (
        !modsHighestRole || !membersHighestRole ||
        !higherRolePosition(
          message.guildID,
          modsHighestRole.id,
          membersHighestRole.id,
        )
      ) {
        return botCache.helpers.reactError(message);
      }
    } else {
      if (!args.userID) return botCache.helpers.reactError(message);

      // Leave this for now, ill need to add magic at one point here.
      // TODO: Better USER ID VALIDATION NEEDED HERE
      const banned = await getBans(message.guildID);
      if (banned.has(args.userID)) return botCache.helpers.reactError(message);
    }

    const userID = args.member?.user.id || args.userID!;

    await sendDirectMessage(
      userID,
      `You have been banned from **${guild.name}** by **${message.author.username}** because of: *${args.reason}*.`,
    );

    ban(message.guildID, userID, {
      days: 1,
      reason: args.reason,
    });

    // TODO: NEED TO ADD MOD LOG SUPPORT
    return botCache.helpers.reactSuccess(message);
  },
});

createCommandAliases("ban", ["b"]);

interface BanArgs {
  member?: Member;
  userID?: string;
  reason: string;
}