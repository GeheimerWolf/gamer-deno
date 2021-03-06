import { botCache } from "../../mod.ts";

botCache.arguments.set("...roles", {
  name: "...roles",
  execute: function (argument, parameters, message) {
    if (!parameters.length) return;

    const guild = message.guild();
    if (!guild) return;

    return parameters.map((word) => {
      const roleID = word.startsWith("<@&")
        ? word.substring(3, word.length - 1)
        : word;

      const name = word.toLowerCase();
      const role = guild.roles.get(roleID) ||
        guild.roles.find((r) => r.name.toLowerCase() === name);
      if (role) return role;
    });
  },
});
