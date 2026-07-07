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

export const CLASSIC_PREVIEW_STATUS_FALLBACK = {
  system_name: '柒',
  server_address: 'https://acaim.cn',
  docs_link: 'https://docs.newapi.pro',
  logo: 'https://acaim.cn/logo.png',
  register_enabled: false,
  footer_html: '',
  quota_per_unit: 500000,
  display_in_currency: true,
  quota_display_type: 'USD',
  enable_drawing: true,
  enable_task: true,
  enable_data_export: true,
  chats: [
    { 'CC Switch': 'ccswitch' },
    {
      Codex安装助手:
        'codex-assistant://import-provider?provider=ACAIM&homepage={address}&endpoint={address}%2Fv1&apiKey={key}&model=gpt-5.5&protocol=responses&apply=1',
    },
  ],
  data_export_default_time: 'hour',
  default_collapse_sidebar: false,
  mj_notify_enabled: false,
  HeaderNavModules:
    '{"home":true,"console":true,"pricing":{"enabled":true,"requireAuth":true},"monitoring":true,"rankings":{"enabled":false,"requireAuth":false},"docs":true,"about":false}',
  password_login_enabled: true,
  password_register_enabled: true,
  github_oauth: false,
  linuxdo_oauth: false,
  telegram_oauth: false,
  custom_oauth_providers: [],
  faq: [],
  faq_enabled: true,
  announcements: [],
  announcements_enabled: true,
  api_info: [
    {
      id: 1,
      route: '主线路',
      description: '默认入口',
      url: 'https://acaim.cn',
      color: 'blue',
    },
  ],
  api_info_enabled: true,
};
