import {
  MessageContent,
  sendMessage,
  deleteMessage,
  editMessage,
  Message,
  Channel,
} from "../../deps.ts";
import { botCache } from "../../mod.ts";
import { Embed } from "./Embed.ts";
import { Command } from "../types/commands.ts";

/** This function should be used when you want to send a response that will @mention the user and delete it after a certain amount of seconds. By default, it will be deleted after 10 seconds. */
export async function sendAlertResponse(
  message: Message,
  content: string | MessageContent,
  timeout = 10,
  reason = "",
) {
  const response = await sendResponse(message, content);
  deleteMessage(response, reason, timeout * 1000);
}

/** This function should be used when you want to send a response that will @mention the user. */
export function sendResponse(
  message: Message,
  content: string | MessageContent,
) {
  const mention = `<@!${message.author.id}>`;
  const contentWithMention = typeof content === "string"
    ? `${mention}, ${content}`
    : { ...content, content: `${mention}, ${content.content}` };

  return sendMessage(message.channel, contentWithMention);
}

/** This function should be used when you want to convert milliseconds to a human readable format like 1d5h. */
export function humanizeMilliseconds(milliseconds: number) {
  // Gets ms into seconds
  const time = milliseconds / 1000;

  const days = Math.floor(time / 86400);
  const hours = Math.floor((time % 86400) / 3600);
  const minutes = Math.floor(((time % 86400) % 3600) / 60);
  const seconds = Math.floor(((time % 86400) % 3600) % 60);

  const dayString = days ? `${days}d ` : "";
  const hourString = hours ? `${hours}h ` : "";
  const minuteString = minutes ? `${minutes}m ` : "";
  const secondString = seconds ? `${seconds}s ` : "";

  return `${dayString}${hourString}${minuteString}${secondString}`;
}

/** This function helps convert a string like 1d5h to milliseconds. */
export function stringToMilliseconds(text: string) {
  const matches = text.match(/(\d+[w|d|h|m]{1})/g);
  if (!matches) return;

  let total = 0;

  for (const match of matches) {
    // Finds the first of these letters
    const validMatch = /(w|d|h|m|s)/.exec(match);
    // if none of them were found cancel
    if (!validMatch) return;
    // Get the number which should be before the index of that match
    const number = match.substring(0, validMatch.index);
    // Get the letter that was found
    const [letter] = validMatch;
    if (!number || !letter) return;

    let multiplier = botCache.constants.milliseconds.SECOND;
    switch (letter.toLowerCase()) {
      case `w`:
        multiplier = botCache.constants.milliseconds.WEEK;
        break;
      case `d`:
        multiplier = botCache.constants.milliseconds.DAY;
        break;
      case `h`:
        multiplier = botCache.constants.milliseconds.HOUR;
        break;
      case `m`:
        multiplier = botCache.constants.milliseconds.MINUTE;
        break;
    }

    const amount = number ? parseInt(number, 10) : undefined;
    if (!amount) return;

    total += amount * multiplier;
  }

  return total;
}

/** This function should be used to create command aliases. */
export function createCommandAliases(
  commandName: string,
  aliases: string | string[],
) {
  if (typeof aliases === "string") aliases = [aliases];

  for (const alias of aliases) {
    const command = botCache.commandAliases.get(alias)
    // Setting the alias again probably due to reloading.
    if (command === commandName) continue;

    botCache.commandAliases.set(alias, commandName);
  }
}

export function createSubcommand(commandName: string, subcommand: Command) {
  const command = botCache.commands.get(commandName);
  if (!command) return;

  if (!command.subcommands) {
    command.subcommands = new Map()
  }

  command.subcommands.set(subcommand.name, subcommand);
}

/** Use this function to send an embed with ease. */
export function sendEmbed(channel: Channel, embed: Embed, content?: string) {
  return sendMessage(channel, { content, embed });
}

/** Use this function to edit an embed with ease. */
export function editEmbed(message: Message, embed: Embed, content?: string) {
  return editMessage(message, { content, embed });
}

// Very important to make sure files are reloaded properly
let uniqueFilePathCounter = 0;
/** This function allows reading all files in a folder. Useful for loading/reloading commands, monitors etc */
export async function importDirectory(path: string) {
  const files = Deno.readDirSync(Deno.realPathSync(path));

  for (const file of files) {
    if (!file.name) continue;

    const currentPath = `${path}/${file.name}`;
    if (file.isFile) {
      await import(`file:///${currentPath}#${uniqueFilePathCounter}`);
      continue;
    }

    importDirectory(currentPath);
  }
  uniqueFilePathCounter++;
}
