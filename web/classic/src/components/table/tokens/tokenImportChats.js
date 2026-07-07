/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

export const TOKEN_IMPORT_CHAT_DEFAULTS = [
  {
    name: 'CC Switch',
    url: 'ccswitch',
  },
  {
    name: 'Codex安装助手',
    url: 'codex-assistant://import-provider?provider=ACAIM&homepage={address}&endpoint={address}%2Fv1&apiKey={key}&model=gpt-5.5&protocol=responses&apply=1',
  },
];

const TOKEN_IMPORT_CHAT_NAME_ALIASES = new Map([
  ['CCSwitch', 'CC Switch'],
  ['Codex安装助手', 'Codex安装助手'],
]);

export const normalizeTokenImportChatName = (name) =>
  String(name || '').replace(/\s+/g, '');

export const toTokenImportChatName = (name) =>
  TOKEN_IMPORT_CHAT_NAME_ALIASES.get(normalizeTokenImportChatName(name)) || '';

export const resolveTokenImportChats = (storedChats) => {
  const resolvedByName = new Map(
    TOKEN_IMPORT_CHAT_DEFAULTS.map((item) => [item.name, item]),
  );

  if (Array.isArray(storedChats)) {
    for (const item of storedChats) {
      if (!item || typeof item !== 'object') continue;
      const rawName = Object.keys(item)[0];
      const name = toTokenImportChatName(rawName);
      if (!name) continue;
      const url = item[rawName];
      if (typeof url !== 'string' || !url) continue;
      resolvedByName.set(name, { name, url });
    }
  }

  return TOKEN_IMPORT_CHAT_DEFAULTS.map((item) =>
    resolvedByName.get(item.name),
  ).filter(Boolean);
};
