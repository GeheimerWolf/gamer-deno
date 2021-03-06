import { botCache } from "../../../mod.ts";
import {
  memberIDHasPermission,
  Member,
  avatarURL,
  Permission,
  Permissions,
} from "../../../deps.ts";
import { Embed } from "../../utils/Embed.ts";
import { translate } from "../../utils/i18next.ts";
import {
  sendEmbed,
  createCommandAliases,
  humanizeMilliseconds,
} from "../../utils/helpers.ts";

botCache.commands.set(`user`, {
  name: `user`,
  guildOnly: true,
  arguments: [
    {
      name: "member",
      type: "member",
      required: false,
    },
  ],
  execute: async (message, args: UserInfoArgs, guild) => {
    if (!guild) return;

    const member = args.member || message.member();
    if (!member) return;

    // const activity = await analyticsDatabase.find({
    //   userID: member.user.id,
    //   guildID: guild.id,
    //   type: "MESSAGE_CREATE",
    // })
    //   .sort("-timestamp")
    //   .limit(1);

    const roles = member.roles.filter((id) => guild.roles.has(id))
      .sort((a, b) =>
        (guild.roles.get(b)?.position || 0) -
        (guild.roles.get(a)?.position || 0)
      )
      .map((id) => `<@&${id}>`)
      .join(`, `);

    const createdAt = botCache.helpers.snowflakeToTimestamp(member.user.id);
    const memberPerms = Object.keys(Permissions).filter((key) =>
      isNaN(Number(key))
    )
      .map((key) =>
        memberIDHasPermission(
            member.user.id,
            member.guildID,
            [key as Permission],
          )
          ? key
          : ""
      ).filter((k) => k);

    const embed = new Embed()
      .setAuthor(member.nick || member.tag, avatarURL(member))
      .setThumbnail(avatarURL(member))
      .addField(translate(guild.id, "common:USER_ID"), member.user.id, true)
      .addField(
        translate(guild.id, "common:CREATED_ON"),
        [
          new Date(createdAt)
            .toISOString().substr(0, 10),
          humanizeMilliseconds(Date.now() - createdAt),
        ].join("\n"),
        true,
      )
      .addField(
        translate(guild.id, "common:JOINED_ON"),
        [
          new Date(member.joinedAt).toISOString().substr(0, 10),
          humanizeMilliseconds(Date.now() - member.joinedAt),
        ].join("\n"),
        true,
      )
      .addField(
        translate(guild.id, `common:PERMISSIONS`),
        memberPerms.includes("ADMINISTRATOR")
          ? translate(guild.id, `common:ADMINISTRATOR`)
          : memberPerms.sort().join(`, `),
      );

    // const [action] = activity;
    // if (action) {
    //   embed.setFooter(
    //     translate(guild.id, "commands/user:LAST_ACTIVE", {
    //       time: humanizeMilliseconds(
    //         Date.now() - action.timestamp,
    //       ) || translate(guild.id, "common:NOW"),
    //     }),
    //   );
    // }

    if (roles) embed.addField(translate(guild.id, `common:ROLES`), roles);

    sendEmbed(message.channelID, embed);
    // TODO: Complete mission
  },
});

createCommandAliases("user", ["userinfo", "ui"]);

interface UserInfoArgs {
  member?: Member;
}
