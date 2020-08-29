import { botCache } from "../../../../mod.ts";
import { Role, addReaction } from "../../../../deps.ts";
import { createSubcommand } from "../../../utils/helpers.ts";
import { PermissionLevels } from "../../../types/commands.ts";
import { uniqueRoleSetsDatabase } from "../../../database/schemas/uniquerolesets.ts";

createSubcommand("roles-unique", {
  name: "add",
  permissionLevels: [PermissionLevels.ADMIN],
  arguments: [
    { name: "name", type: "string", lowercase: true },
    { name: "roles", type: "...roles" },
  ],
  guildOnly: true,
  execute: async (message, args: RoleUniqueAddArgs) => {
    const exists = await uniqueRoleSetsDatabase.findOne({
      name: args.name,
      guildID: message.guildID,
    });
    if (!exists) return addReaction(message.channelID, message.id, "❌");

    const roleIDs = new Set(
      [...exists.roleIDs, ...args.roles.map((role) => role.id)],
    );

    // Create a roleset
    uniqueRoleSetsDatabase.updateOne(
      { name: args.name, guildID: message.guildID },
      { $set: { roleIDs: [...roleIDs.values()] } },
    );

    return addReaction(
      message.channelID,
      message.id,
      botCache.constants.emojis.success,
    );
  },
});

interface RoleUniqueAddArgs {
  name: string;
  roles: Role[];
}
