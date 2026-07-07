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

export const CODEX_RATE_ANNOUNCEMENT = {
  id: 'codex-rate-0-09-20260707',
  content: 'Codex 特惠倍率已从 0.15 调整为 0.09（暂时爽登）',
  publishDate: '2026-07-07T16:15:00+08:00',
  type: 'success',
  extra: 'Codex 特惠活动已生效，具体可用模型与扣费以实际请求为准。',
};

export const ensureSystemAnnouncements = (status = {}) => {
  const announcements = Array.isArray(status.announcements)
    ? status.announcements
    : [];

  const hasCodexRateAnnouncement = announcements.some(
    (item) =>
      item?.id === CODEX_RATE_ANNOUNCEMENT.id ||
      item?.content === CODEX_RATE_ANNOUNCEMENT.content,
  );

  if (hasCodexRateAnnouncement) {
    return {
      ...status,
      announcements,
      announcements_enabled: status.announcements_enabled ?? true,
    };
  }

  return {
    ...status,
    announcements: [CODEX_RATE_ANNOUNCEMENT, ...announcements],
    announcements_enabled: status.announcements_enabled ?? true,
  };
};
