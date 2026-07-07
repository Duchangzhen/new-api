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

import { ensureSystemAnnouncements } from './systemAnnouncements';

export function setStatusData(data) {
  const statusData = ensureSystemAnnouncements(data);
  localStorage.setItem('status', JSON.stringify(statusData));
  localStorage.setItem('system_name', statusData.system_name);
  localStorage.setItem('logo', statusData.logo);
  localStorage.setItem('footer_html', statusData.footer_html);
  localStorage.setItem('quota_per_unit', statusData.quota_per_unit);
  // 兼容：保留旧字段，同时写入新的额度展示类型
  localStorage.setItem('display_in_currency', statusData.display_in_currency);
  localStorage.setItem(
    'quota_display_type',
    statusData.quota_display_type || 'USD',
  );
  localStorage.setItem('enable_drawing', statusData.enable_drawing);
  localStorage.setItem('enable_task', statusData.enable_task);
  localStorage.setItem('enable_data_export', statusData.enable_data_export);
  localStorage.setItem('chats', JSON.stringify(statusData.chats));
  localStorage.setItem(
    'data_export_default_time',
    statusData.data_export_default_time,
  );
  localStorage.setItem(
    'default_collapse_sidebar',
    statusData.default_collapse_sidebar,
  );
  localStorage.setItem('mj_notify_enabled', statusData.mj_notify_enabled);
  if (statusData.chat_link) {
    // localStorage.setItem('chat_link', data.chat_link);
  } else {
    localStorage.removeItem('chat_link');
  }
  if (statusData.chat_link2) {
    // localStorage.setItem('chat_link2', data.chat_link2);
  } else {
    localStorage.removeItem('chat_link2');
  }
  if (statusData.docs_link) {
    localStorage.setItem('docs_link', statusData.docs_link);
  } else {
    localStorage.removeItem('docs_link');
  }
}

export function setUserData(data) {
  localStorage.setItem('user', JSON.stringify(data));
}
