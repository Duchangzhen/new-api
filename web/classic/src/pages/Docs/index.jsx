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

import React, { useContext, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@douyinfe/semi-ui';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Copy,
  ExternalLink,
  Film,
  KeyRound,
  Layers3,
  Monitor,
  Network,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import { Claude, Gemini, OpenAI } from '@lobehub/icons';
import { StatusContext } from '../../context/Status';
import { copy, getSystemName, showSuccess } from '../../helpers';
import { CLASSIC_PREVIEW_STATUS_FALLBACK } from '../../constants/previewStatus.constant';

const removeTrailingSlash = (value) =>
  (typeof value === 'string' ? value : '').replace(/\/+$/, '');

const getBrowserOrigin = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.origin;
};

const getSiteOrigin = (status) => {
  const configuredAddress = removeTrailingSlash(status?.server_address);
  const browserOrigin = removeTrailingSlash(getBrowserOrigin());

  return (
    configuredAddress ||
    browserOrigin ||
    CLASSIC_PREVIEW_STATUS_FALLBACK.server_address
  );
};

const COMMON_FLOW = [
  {
    title: '注册或登录账号',
    body: '打开本站，点击右上角注册或登录。新客户建议先完成邮箱验证，避免后续创建 Key 时收不到通知。',
    link: '/register',
    linkText: '去注册',
  },
  {
    title: '进入控制台',
    body: '登录后进入控制台，先确认账户余额、可用分组和模型权限。余额不足时先在充值页面补充额度。',
    link: '/console',
    linkText: '进入控制台',
  },
  {
    title: '生成 API Key',
    body: '进入令牌管理，新建令牌，填写名称，按需要设置额度、模型范围和过期时间。提交后复制以 sk- 开头的 Key。',
    link: '/console/token',
    linkText: '令牌管理',
  },
  {
    title: '填入客户端并验证',
    body: '把 Key 和对应 Base URL 填进 Codex、Claude Code、Gemini CLI 或其他工具，先拉取模型列表，再发起一次简单对话测试。',
  },
];

const createDocs = (endpoints) => [
  {
    slug: 'claude-code',
    title: 'Claude Code',
    vendor: 'Anthropic',
    Icon: Claude.Color,
    iconClassName: 'bg-[#f4f4f2]',
    description:
      'Anthropic 官方 AI 编程助手，支持终端交互、代码分析、Git 工作流、项目级修改和多轮开发任务。',
    summary:
      '适合已经习惯 Claude 工作流的客户。本站兼容 Anthropic Messages 接口，Claude Code 请求会落到 /v1/messages。',
    endpointLabel: 'Claude 兼容地址',
    endpoint: endpoints.claude,
    model: 'claude-3-7-sonnet / claude-3-5-sonnet',
    tags: ['终端', '代码分析', 'Git 工作流'],
    sections: [
      {
        title: '安装 Claude Code',
        body: '先确认本机已安装 Node.js 18 或更高版本，然后安装 Claude Code。安装完成后运行 claude --version 确认命令可用。',
        commands: [
          {
            label: 'macOS / Linux / Windows',
            code: 'npm install -g @anthropic-ai/claude-code\nclaude --version',
          },
        ],
      },
      {
        title: '配置本站 Key',
        body: 'Claude 类客户端通常把 Base URL 填为站点根地址，客户端会自动请求 /v1/messages。如果某个版本要求 API 前缀，则改填 /v1。',
        commands: [
          {
            label: 'macOS / Linux',
            code: `export ANTHROPIC_API_KEY="sk-你的本站Key"\nexport ANTHROPIC_BASE_URL="${endpoints.claude}"\nclaude`,
          },
          {
            label: 'Windows PowerShell',
            code: `$env:ANTHROPIC_API_KEY="sk-你的本站Key"\n$env:ANTHROPIC_BASE_URL="${endpoints.claude}"\nclaude`,
          },
        ],
      },
      {
        title: '开始使用',
        body: '进入项目目录后启动 claude，让它先读取项目结构，再提出明确任务。首次测试建议问“读取当前项目并总结目录结构”。',
        commands: [
          {
            label: '项目内启动',
            code: 'cd your-project\nclaude',
          },
        ],
      },
      {
        title: '排错要点',
        body: '401 通常是 Key 没复制完整或令牌被禁用；404 多半是 Base URL 多写或少写了 /v1；模型不可用时到控制台确认令牌允许的模型分组。',
      },
    ],
  },
  {
    slug: 'codex',
    title: 'Codex CLI & App',
    vendor: 'OpenAI',
    Icon: OpenAI,
    iconClassName: 'bg-[#f1f5f9]',
    description:
      'OpenAI 推出的编程智能体工具，可读取、修改和运行代码，支持多模型选择和本地开发协作。',
    summary:
      'Codex 走 OpenAI 兼容接口，Base URL 使用 /v1，Key 使用你在本站令牌管理里创建的 sk- 开头密钥。',
    endpointLabel: 'OpenAI 兼容地址',
    endpoint: endpoints.openai,
    model: 'gpt-4.1 / gpt-4o / deepseek-v4-flash',
    tags: ['CLI', '桌面应用', 'OpenAI 兼容'],
    sections: [
      {
        title: '生成本站 API Key',
        body: '登录本站后进入控制台，打开令牌管理，点击新建令牌。建议名称写 Codex，额度按需设置，创建后立即复制 Key。',
      },
      {
        title: '配置 Codex CLI',
        body: '在终端设置 OpenAI 兼容环境变量，然后启动 Codex。OPENAI_BASE_URL 必须带 /v1。',
        commands: [
          {
            label: 'macOS / Linux',
            code: `export OPENAI_API_KEY="sk-你的本站Key"\nexport OPENAI_BASE_URL="${endpoints.openai}"\ncodex`,
          },
          {
            label: 'Windows PowerShell',
            code: `$env:OPENAI_API_KEY="sk-你的本站Key"\n$env:OPENAI_BASE_URL="${endpoints.openai}"\ncodex`,
          },
        ],
      },
      {
        title: '配置 Codex App',
        body: '打开 Codex App 设置，选择 OpenAI Compatible 或自定义 Provider。API Key 填本站令牌，Base URL 填 /v1，模型填控制台可用模型名。',
      },
      {
        title: '验证连接',
        body: '让 Codex 执行一个只读任务，例如“列出当前目录并解释项目结构”。如果模型列表为空，先检查令牌分组和余额。',
      },
    ],
  },
  {
    slug: 'gemini',
    title: 'Gemini CLI',
    vendor: 'Google',
    Icon: Gemini.Color,
    iconClassName: 'bg-[#eef4ff]',
    description:
      'Google 官方 Gemini 命令行工具，支持代码辅助、文件操作、上下文问答和多种安装方式。',
    summary:
      'Gemini 原生请求使用 /v1beta/models 路径。支持自定义 Gemini Endpoint 的客户端填站点根地址或 /v1beta。',
    endpointLabel: 'Gemini 兼容地址',
    endpoint: endpoints.gemini,
    model: 'gemini-2.5-pro / gemini-2.5-flash',
    tags: ['Gemini', '命令行', '多模态'],
    sections: [
      {
        title: '安装 Gemini CLI',
        body: '先安装 Node.js 18+，再安装 Gemini CLI。不同版本命令可能略有差异，安装后先运行 gemini --version。',
        commands: [
          {
            label: 'macOS / Linux / Windows',
            code: 'npm install -g @google/gemini-cli\ngemini --version',
          },
        ],
      },
      {
        title: '配置本站 Key',
        body: 'Gemini 原生接口通常使用 GEMINI_API_KEY。若你的 Gemini CLI 版本支持自定义 API 地址，把 Base URL 填为本站 Gemini 兼容地址。',
        commands: [
          {
            label: 'macOS / Linux',
            code: `export GEMINI_API_KEY="sk-你的本站Key"\nexport GEMINI_BASE_URL="${endpoints.gemini}"\ngemini`,
          },
          {
            label: 'Windows PowerShell',
            code: `$env:GEMINI_API_KEY="sk-你的本站Key"\n$env:GEMINI_BASE_URL="${endpoints.gemini}"\ngemini`,
          },
        ],
      },
      {
        title: '无法设置 Base URL 时',
        body: '如果当前版本 Gemini CLI 不支持自定义 Endpoint，请改用支持 OpenAI Compatible Provider 的客户端，Base URL 填 /v1，模型名填 gemini 系列模型。',
      },
      {
        title: '验证连接',
        body: '先执行一个短问题，例如“用一句话说明你是谁”。如果返回认证失败，检查 Key 是否以 sk- 开头并且令牌没有过期。',
      },
    ],
  },
  {
    slug: 'opencode',
    title: 'Opencode',
    vendor: 'Open Source Community',
    Icon: Code2,
    iconClassName: 'bg-[#f1f5f9] text-[#111827]',
    description:
      '开源 AI 编程智能体，支持终端界面、桌面应用和 IDE 扩展等使用模式。',
    summary:
      'Opencode 推荐使用 OpenAI 兼容 Provider。把本站 /v1 作为 Base URL，再填入 Key 和模型名即可。',
    endpointLabel: 'OpenAI 兼容地址',
    endpoint: endpoints.openai,
    model: 'gpt-4.1 / claude-3-7-sonnet / deepseek-v4-flash',
    tags: ['开源', '终端', 'IDE'],
    sections: [
      {
        title: '安装 Opencode',
        body: '根据你的安装方式选择 npm、bun 或桌面版。安装后先确认 opencode 命令存在。',
        commands: [
          {
            label: 'npm',
            code: 'npm install -g opencode-ai\nopencode --version',
          },
          {
            label: 'bun',
            code: 'bun install -g opencode-ai\nopencode --version',
          },
        ],
      },
      {
        title: '添加自定义 Provider',
        body: '在 Opencode 的 Provider 设置里选择 OpenAI Compatible。名称可写 ACAIM，Base URL 填 /v1，API Key 填本站令牌。',
        commands: [
          {
            label: '配置示例',
            code: `{\n  "provider": "openai-compatible",\n  "name": "ACAIM",\n  "baseURL": "${endpoints.openai}",\n  "apiKey": "sk-你的本站Key",\n  "model": "gpt-4.1"\n}`,
          },
        ],
      },
      {
        title: '项目内使用',
        body: '进入项目目录后启动 Opencode，先让它读取 README 和 package 文件，再要求它修改代码。大任务建议分步骤提交。',
      },
      {
        title: '排错要点',
        body: '如果提示 unsupported provider，改选 OpenAI Compatible；如果提示 model not found，到控制台查看令牌允许的模型列表。',
      },
    ],
  },
  {
    slug: 'openclaw',
    title: 'OpenClaw',
    vendor: 'Open Source Community',
    Icon: Workflow,
    iconClassName: 'bg-[#f6f3ff] text-[#6d28d9]',
    description:
      '强大的 AI 自动化智能体平台，支持多渠道消息集成、网页任务、工具扩展和工作流编排。',
    summary:
      'OpenClaw 按自定义 OpenAI 兼容模型接入，适合自动化任务和多工具调用场景。',
    endpointLabel: 'OpenAI 兼容地址',
    endpoint: endpoints.openai,
    model: 'gpt-4.1 / deepseek-v4-flash',
    tags: ['自动化', '工具调用', '工作流'],
    sections: [
      {
        title: '准备 Key',
        body: '建议单独创建一个名为 OpenClaw 的令牌，并限制额度。自动化任务可能连续调用模型，额度限制能避免误用。',
      },
      {
        title: '配置模型供应商',
        body: '进入 OpenClaw 设置页，新增 Provider，类型选择 OpenAI Compatible。Base URL 填本站 /v1，API Key 填令牌，默认模型填可用模型名。',
        commands: [
          {
            label: 'Provider 示例',
            code: `Provider: OpenAI Compatible\nName: ACAIM\nBase URL: ${endpoints.openai}\nAPI Key: sk-你的本站Key\nDefault Model: gpt-4.1`,
          },
        ],
      },
      {
        title: '绑定到 Agent',
        body: '在 Agent 配置中选择刚创建的 ACAIM Provider，开启需要的工具权限。首次运行建议只打开文件读取和网页搜索等低风险工具。',
      },
      {
        title: '验证工作流',
        body: '创建一个简单任务，例如“读取网页标题并总结”。确认调用日志、模型输出和扣费记录都正常后再接生产任务。',
      },
    ],
  },
  {
    slug: 'hermes',
    title: 'Hermes Agent',
    vendor: 'Nous Research',
    Icon: Bot,
    iconClassName: 'bg-[#f4f4f5] text-[#0f766e]',
    description:
      '具有学习能力的 AI 智能体，能从执行经验中积累技能并自主优化能力。',
    summary:
      'Hermes Agent 可按 OpenAI 兼容模型接入。建议为长期运行 Agent 单独创建低额度令牌。',
    endpointLabel: 'OpenAI 兼容地址',
    endpoint: endpoints.openai,
    model: 'gpt-4.1 / hermes / deepseek-v4-flash',
    tags: ['Agent', '长期任务', '技能记忆'],
    sections: [
      {
        title: '创建专用令牌',
        body: '长期 Agent 会持续发起请求，建议单独创建 Hermes Agent 专用 Key，并设置每日或总额度上限。',
      },
      {
        title: '填写连接信息',
        body: '在 Hermes Agent 的模型设置中选择 Custom OpenAI 或 OpenAI Compatible。Base URL 填 /v1，API Key 填本站 Key。',
        commands: [
          {
            label: '环境变量示例',
            code: `OPENAI_API_KEY=sk-你的本站Key\nOPENAI_BASE_URL=${endpoints.openai}\nHERMES_MODEL=gpt-4.1`,
          },
        ],
      },
      {
        title: '设置安全边界',
        body: '首次运行关闭危险工具，只保留读取、搜索和计划类能力。确认 Agent 行为稳定后，再逐步开放写文件、执行命令等权限。',
      },
      {
        title: '观察调用记录',
        body: '运行后进入控制台日志页查看请求、模型、消耗和错误信息。若频率过高，可给令牌增加速率限制或降低 Agent 并发。',
      },
    ],
  },
  {
    slug: 'seedance',
    title: 'Seedance',
    vendor: 'ByteDance',
    Icon: Film,
    iconClassName: 'bg-[#fff7ed] text-[#ea580c]',
    description:
      '视频生成模型接入教程，适合把文生视频、图生视频等能力接到支持 OpenAI 视频接口的客户端。',
    summary:
      '视频接口走 OpenAI 兼容视频路径。客户端支持自定义 OpenAI 视频接口时，Base URL 仍填本站 /v1。',
    endpointLabel: 'OpenAI 视频兼容地址',
    endpoint: endpoints.openai,
    model: 'seedance / sora-video / veo',
    tags: ['视频生成', '多模态', 'OpenAI 兼容'],
    sections: [
      {
        title: '确认账号权限',
        body: '视频模型消耗通常更高。创建 Key 前先确认账户余额、模型权限和分组可用，必要时单独给视频任务创建令牌。',
      },
      {
        title: '配置视频客户端',
        body: '在支持 OpenAI 视频接口的客户端里填入本站 /v1 和 API Key，模型名使用控制台可见的视频模型名。',
        commands: [
          {
            label: '请求示例',
            code: `curl "${endpoints.openai}/videos" \\\n  -H "Authorization: Bearer sk-你的本站Key" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "seedance",\n    "prompt": "A clean product demo video, smooth camera movement"\n  }'`,
          },
        ],
      },
      {
        title: '查看任务结果',
        body: '视频任务可能是异步返回。提交后保存 task id，在客户端或控制台查看任务状态，完成后再下载结果。',
      },
      {
        title: '成本建议',
        body: '视频生成建议设置较低令牌额度并先小批量测试。确认分辨率、时长和提示词稳定后再扩大调用。',
      },
    ],
  },
];

const CopyButton = ({ value, label = '复制' }) => {
  const handleCopy = async () => {
    const ok = await copy(value);

    if (ok) {
      showSuccess('已复制到剪贴板');
    }
  };

  return (
    <button
      type='button'
      onClick={handleCopy}
      className='inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-[#dedede] bg-white px-2.5 text-xs font-medium text-[#4b5563] transition hover:border-[#c9c9c9] hover:bg-[#f8f8f8]'
    >
      <Copy size={13} />
      {label}
    </button>
  );
};

const CodeBlock = ({ label, code }) => (
  <div className='overflow-hidden rounded-xl border border-[#e6e6e6] bg-[#111827]'>
    <div className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5'>
      <span className='text-xs font-semibold text-[#cbd5e1]'>{label}</span>
      <button
        type='button'
        onClick={() => copy(code).then((ok) => ok && showSuccess('已复制代码'))}
        className='inline-flex h-7 items-center gap-1 rounded-md bg-[#263244] px-2 text-xs font-medium text-[#e5e7eb] transition hover:bg-[#334155]'
      >
        <Copy size={12} />
        复制
      </button>
    </div>
    <pre className='max-w-full overflow-x-auto px-4 py-4 text-[13px] leading-6 text-[#e5e7eb]'>
      <code>{code}</code>
    </pre>
  </div>
);

const DocIcon = ({ doc, size = 30 }) => {
  const Icon = doc.Icon;

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${doc.iconClassName}`}
    >
      <Icon size={size} />
    </div>
  );
};

const DocsIndex = ({ docs, systemName }) => (
  <div className='classic-page-fill bg-white'>
    <main className='mx-auto w-full max-w-[1120px] px-5 pt-[118px] pb-20 md:px-6 md:pt-[128px]'>
      <header className='mx-auto max-w-[820px] text-center'>
        <h1 className='m-0 text-[34px] font-bold leading-[1.18] text-[#0f172a] md:text-[40px]'>
          集成文档 — {systemName}
        </h1>
        <p className='mx-auto mt-4 max-w-[760px] text-[17px] leading-8 text-[#4b5563] md:text-[18px]'>
          主流 AI 编程工具的安装与使用教程，所有教程支持 Windows、macOS 和 Linux
          平台。从注册账号、生成 Key，到接入 Codex、Claude Code、Gemini
          CLI，一步一步写清楚。
        </p>
      </header>

      <section className='mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            to={`/docs/${doc.slug}`}
            className='group flex min-h-[260px] flex-col rounded-[21px] border border-[#e6e6e6] bg-white p-5 text-left no-underline shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d5d5d5] hover:shadow-[0_14px_35px_rgba(15,23,42,0.08)]'
          >
            <div className='flex items-start justify-between gap-4'>
              <DocIcon doc={doc} />
              <span className='flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#9ca3af] transition group-hover:border-[#e5e7eb] group-hover:text-[#111827]'>
                <ArrowRight size={18} />
              </span>
            </div>

            <div className='mt-6 min-w-0'>
              <h2 className='m-0 break-words text-[22px] font-bold leading-7 text-[#111827]'>
                {doc.title}
              </h2>
              <div className='mt-2 text-[14px] font-semibold leading-5 text-[#6b7280]'>
                {doc.vendor}
              </div>
              <p className='mt-5 line-clamp-4 text-[15px] leading-7 text-[#4b5563]'>
                {doc.description}
              </p>
            </div>

            <div className='mt-auto flex flex-wrap gap-2 pt-5'>
              {doc.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className='rounded-full bg-[#f6f6f6] px-3 py-1 text-xs font-medium text-[#6b7280]'
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </main>
  </div>
);

const EndpointCard = ({ icon: Icon, label, value }) => (
  <div className='rounded-2xl border border-[#e6e6e6] bg-white p-4'>
    <div className='mb-3 flex items-center gap-2 text-sm font-semibold text-[#111827]'>
      <Icon size={16} />
      {label}
    </div>
    <div className='flex items-center justify-between gap-3'>
      <code className='min-w-0 break-all rounded-lg bg-[#f8fafc] px-2.5 py-1.5 text-[13px] text-[#374151]'>
        {value}
      </code>
      <CopyButton value={value} />
    </div>
  </div>
);

const DocsDetail = ({ doc, docs }) => (
  <div className='classic-page-fill bg-white'>
    <main className='mx-auto grid w-full max-w-[1120px] gap-8 px-5 pt-[104px] pb-20 md:px-6 md:pt-[118px] lg:grid-cols-[minmax(0,1fr)_310px]'>
      <article className='min-w-0'>
        <Link
          to='/docs'
          className='mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#6b7280] no-underline transition hover:text-[#111827]'
        >
          <ArrowLeft size={16} />
          返回文档
        </Link>

        <header className='rounded-[22px] border border-[#e6e6e6] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-8'>
          <div className='flex flex-col gap-5 sm:flex-row sm:items-start'>
            <DocIcon doc={doc} size={34} />
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-semibold text-[#6b7280]'>
                {doc.vendor}
              </div>
              <h1 className='m-0 mt-2 break-words text-[34px] font-bold leading-[1.12] text-[#0f172a] md:text-[42px]'>
                {doc.title}
              </h1>
              <p className='mt-4 text-[16px] leading-8 text-[#4b5563]'>
                {doc.summary}
              </p>
            </div>
          </div>
        </header>

        <section className='mt-6 grid gap-4 md:grid-cols-3'>
          <EndpointCard
            icon={Network}
            label={doc.endpointLabel}
            value={doc.endpoint}
          />
          <EndpointCard
            icon={KeyRound}
            label='API Key'
            value='sk-你的本站Key'
          />
          <EndpointCard icon={Sparkles} label='推荐模型' value={doc.model} />
        </section>

        <section className='mt-8 rounded-[22px] border border-[#e6e6e6] bg-white p-6 md:p-7'>
          <div className='mb-6 flex items-center gap-2'>
            <ClipboardCheck size={20} />
            <h2 className='m-0 text-[22px] font-bold text-[#111827]'>
              从注册到生成 Key
            </h2>
          </div>

          <div className='grid gap-4'>
            {COMMON_FLOW.map((step, index) => (
              <div
                key={step.title}
                className='grid gap-3 rounded-2xl border border-[#ededed] bg-[#fcfcfc] p-4 sm:grid-cols-[34px_minmax(0,1fr)_auto]'
              >
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-[#111827] text-sm font-bold text-white'>
                  {index + 1}
                </div>
                <div className='min-w-0'>
                  <h3 className='m-0 text-base font-bold text-[#111827]'>
                    {step.title}
                  </h3>
                  <p className='m-0 mt-2 text-[14px] leading-7 text-[#4b5563]'>
                    {step.body}
                  </p>
                </div>
                {step.link ? (
                  <Link
                    to={step.link}
                    className='inline-flex h-9 items-center justify-center gap-1 self-start rounded-lg border border-[#dedede] bg-white px-3 text-sm font-semibold text-[#111827] no-underline transition hover:bg-[#f7f7f7]'
                  >
                    {step.linkText}
                    <ExternalLink size={13} />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className='mt-8 space-y-5'>
          {doc.sections.map((section) => (
            <div
              key={section.title}
              className='rounded-[22px] border border-[#e6e6e6] bg-white p-6 md:p-7'
            >
              <h2 className='m-0 text-[22px] font-bold text-[#111827]'>
                {section.title}
              </h2>
              <p className='mt-3 text-[15px] leading-8 text-[#4b5563]'>
                {section.body}
              </p>
              {section.commands ? (
                <div className='mt-5 grid gap-4'>
                  {section.commands.map((command) => (
                    <CodeBlock
                      key={`${section.title}-${command.label}`}
                      label={command.label}
                      code={command.code}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </section>
      </article>

      <aside className='min-w-0 lg:pt-10'>
        <div className='sticky top-[92px] space-y-4'>
          <div className='rounded-[22px] border border-[#e6e6e6] bg-white p-5'>
            <div className='mb-4 flex items-center gap-2 text-base font-bold text-[#111827]'>
              <CheckCircle2 size={18} />
              接入清单
            </div>
            <div className='space-y-3 text-sm leading-6 text-[#4b5563]'>
              <div className='flex gap-2'>
                <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-[#111827]' />
                账号已注册并能进入控制台
              </div>
              <div className='flex gap-2'>
                <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-[#111827]' />
                令牌管理里已创建 sk- 开头 Key
              </div>
              <div className='flex gap-2'>
                <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-[#111827]' />
                Base URL 按工具类型填写正确
              </div>
              <div className='flex gap-2'>
                <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-[#111827]' />
                已用简单问题验证调用成功
              </div>
            </div>
          </div>

          <div className='rounded-[22px] border border-[#e6e6e6] bg-white p-5'>
            <div className='mb-4 flex items-center gap-2 text-base font-bold text-[#111827]'>
              <Terminal size={18} />
              其他教程
            </div>
            <div className='grid gap-2'>
              {docs
                .filter((item) => item.slug !== doc.slug)
                .slice(0, 6)
                .map((item) => (
                  <Link
                    key={item.slug}
                    to={`/docs/${item.slug}`}
                    className='flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#4b5563] no-underline transition hover:bg-[#f7f7f7] hover:text-[#111827]'
                  >
                    <span className='min-w-0 truncate'>{item.title}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
            </div>
          </div>

          <Link to='/console/token'>
            <Button
              theme='solid'
              type='primary'
              className='!h-11 !w-full !rounded-xl !font-semibold'
              icon={<KeyRound size={16} />}
            >
              去生成 API Key
            </Button>
          </Link>
        </div>
      </aside>
    </main>
  </div>
);

const Docs = () => {
  const { slug } = useParams();
  const [statusState] = useContext(StatusContext);
  const status = statusState?.status || {};
  const siteOrigin = getSiteOrigin(status);
  const systemName =
    status.system_name ||
    (getSystemName() && getSystemName() !== 'New API'
      ? getSystemName()
      : 'ACAIM API');
  const endpoints = useMemo(
    () => ({
      site: siteOrigin,
      openai: `${siteOrigin}/v1`,
      claude: siteOrigin,
      gemini: `${siteOrigin}/v1beta`,
    }),
    [siteOrigin],
  );
  const docs = useMemo(() => createDocs(endpoints), [endpoints]);
  const activeDoc = docs.find((doc) => doc.slug === slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!slug || !activeDoc) {
    return <DocsIndex docs={docs} systemName={systemName} />;
  }

  return <DocsDetail doc={activeDoc} docs={docs} />;
};

export default Docs;
