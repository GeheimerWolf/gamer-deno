import { botCache } from "../../../../../../mod.ts";
import { PermissionLevels } from "../../../../../types/commands.ts";
import {
  createSubcommand,
  sendResponse,
} from "../../../../../utils/helpers.ts";
import { guildsDatabase } from "../../../../../database/schemas/guilds.ts";
import { addReactions, deleteMessages } from "../../../../../../deps.ts";

createSubcommand("settings-mails-questions", {
  name: "add",
  aliases: ["a"],
  permissionLevels: [PermissionLevels.ADMIN],
  guildOnly: true,
  vipServerOnly: true,
  arguments: [
    { name: "type", type: "string", literals: ["message", "reaction"] },
  ],
  execute: async function (message, args) {
    const responseQuestion = await sendResponse(
      message,
      [
        "How would you like users to respond to this question?",
        "",
        "1. Message",
        "2. Reaction",
      ].join("\n"),
    );
    await addReactions(
      message.channelID,
      responseQuestion.id,
      botCache.constants.emojis.numbers.slice(0, 2),
    );
    const typeResponse = await botCache.helpers.needReaction(
      message.author.id,
      responseQuestion.id,
    );
    const messageIDs = [responseQuestion.id];
    if (!typeResponse) {
      deleteMessages(message.channel, messageIDs).catch(() => undefined);
      return botCache.helpers.reactError(message);
    }

    await sendResponse(
      message,
      "Please type the exact question you would like to ask the users now. For example: `What is your in game name?`",
    );
    const textResponse = await botCache.helpers.needMessage(
      message.author.id,
      message.channelID,
    );
    if (!textResponse) {
      deleteMessages(message.channel, messageIDs).catch(() => undefined);
      return botCache.helpers.reactError(message);
    }

    await sendResponse(
      message,
      "Please type the label name you would like to use for this question. For example: `In-Game Name:`",
    );
    const nameResponse = await botCache.helpers.needMessage(
      message.author.id,
      message.channelID,
    );
    if (!nameResponse) {
      deleteMessages(message.channel, messageIDs).catch(() => undefined);
      return botCache.helpers.reactError(message);
    }

    // The user wanted to choose message type
    if (typeResponse === botCache.constants.emojis.numbers[0]) {
      const subtypeQuestion = await sendResponse(
        message,
        [
          "What type of response would you like for the user to provide?",
          "",
          "1. 1 Word text",
          "2. Multiple words",
          "3. A number",
        ].join("\n"),
      );
      await addReactions(
        message.channelID,
        subtypeQuestion.id,
        botCache.constants.emojis.numbers.slice(0, 3),
      );
      const subtypeResponse = await botCache.helpers.needReaction(
        message.author.id,
        subtypeQuestion.id,
      );
      if (!subtypeResponse) {
        deleteMessages(message.channel, messageIDs).catch(() => undefined);
        return botCache.helpers.reactError(message);
      }
      const subtype = subtypeResponse === botCache.constants.emojis.numbers[0]
        ? "string"
        : subtypeResponse === botCache.constants.emojis.numbers[1]
        ? "...string"
        : "number";

      // Update the database
      const settings = await guildsDatabase.findOne(
        { guildID: message.guildID },
      );
      if (!settings) {
        deleteMessages(message.channel, messageIDs).catch(() => undefined);
        return botCache.helpers.reactError(message);
      }

      guildsDatabase.updateOne(
        { guildID: message.guildID },
        {
          $set: {
            mailQuestions: [
              ...settings.mailQuestions,
              {
                type: "message",
                name: nameResponse.content,
                text: textResponse.content,
                subtype,
              },
            ],
          },
        },
      );
      deleteMessages(message.channel, messageIDs).catch(() => undefined);

      return botCache.helpers.reactSuccess(message);
    }

    // Reaction based
    await sendResponse(
      message,
      "Please type the separate options the user can select from. Separate each option using `|`. For example: `NA | SA | EU | SA | EA | CN | SEA`",
    );

    const optionsResponse = await botCache.helpers.needMessage(
      message.author.id,
      message.channelID,
    );
    if (!optionsResponse) {
      deleteMessages(message.channel, messageIDs).catch(() => undefined);
      return botCache.helpers.reactError(message);
    }

    // Update the database
    const settings = await guildsDatabase.findOne(
      { guildID: message.guildID },
    );
    if (!settings) {
      deleteMessages(message.channel, messageIDs).catch(() => undefined);
      return botCache.helpers.reactError(message);
    }

    guildsDatabase.updateOne({ guildID: message.guildID }, {
      mailQuestions: [
        ...settings.mailQuestions,
        {
          name: nameResponse.content,
          text: textResponse.content,
          type: "reaction",
          options: optionsResponse.content.split(" | "),
        },
      ],
    });

    deleteMessages(message.channel, messageIDs).catch(() => undefined);
    return botCache.helpers.reactSuccess(message);
  },
});
