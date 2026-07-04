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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Collapse, Tag, Typography } from '@douyinfe/semi-ui';
import {
  API,
  copy,
  getLogo,
  getRelativeTime,
  getSystemName,
  showSuccess,
} from '../../helpers';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { IconCopy } from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { CLASSIC_PREVIEW_STATUS_FALLBACK } from '../../constants/previewStatus.constant';
import {
  ArrowRight,
  Bell,
  BookOpen,
  ExternalLink,
  HelpCircle,
  Network,
  Sparkles,
} from 'lucide-react';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Claude,
  Gemini,
  DeepSeek,
  Qwen,
  Grok,
  AzureAI,
  Hunyuan,
} from '@lobehub/icons';

const { Text } = Typography;

const isRemoteUrl = (value) => /^https?:\/\//i.test(value);
const toSafeString = (value) =>
  typeof value === 'string' ? value : value == null ? '' : String(value);
const toSafeArray = (value) => (Array.isArray(value) ? value : []);
const toSafeMarkedHtml = (value) => {
  try {
    return marked.parse(toSafeString(value));
  } catch (error) {
    console.error('[Home] Failed to parse markdown:', error);
    return toSafeString(value);
  }
};

const removeTrailingSlash = (value) => toSafeString(value).replace(/\/+$/, '');
const HOME_DOCS_PATH = '/docs';

const getHostname = (value) => {
  const safeValue = toSafeString(value);

  if (!safeValue) {
    return '';
  }

  try {
    return new URL(safeValue).hostname.replace(/^www\./i, '');
  } catch (error) {
    return (
      safeValue.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || safeValue
    );
  }
};

const getRouteDisplayText = (route) => {
  const routeName = toSafeString(route?.route);
  const routeUrl = toSafeString(route?.url);

  if (routeName) {
    return routeName;
  }

  if (routeUrl) {
    return getHostname(routeUrl) || routeUrl;
  }

  return '';
};

const PROVIDER_ICONS = [
  { id: 'openai', icon: <OpenAI size={28} /> },
  { id: 'claude', icon: <Claude.Color size={28} /> },
  { id: 'gemini', icon: <Gemini.Color size={28} /> },
  { id: 'deepseek', icon: <DeepSeek.Color size={28} /> },
  { id: 'qwen', icon: <Qwen.Color size={28} /> },
  { id: 'moonshot', icon: <Moonshot size={28} /> },
  { id: 'xai', icon: <XAI size={28} /> },
  { id: 'zhipu', icon: <Zhipu.Color size={28} /> },
  { id: 'volcengine', icon: <Volcengine.Color size={28} /> },
  { id: 'azure', icon: <AzureAI.Color size={28} /> },
  { id: 'hunyuan', icon: <Hunyuan.Color size={28} /> },
  { id: 'grok', icon: <Grok size={28} /> },
];

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const docsLink = HOME_DOCS_PATH;
  const serverAddress =
    statusState?.status?.server_address ||
    CLASSIC_PREVIEW_STATUS_FALLBACK.server_address;
  const systemName =
    statusState?.status?.system_name ||
    (getSystemName() && getSystemName() !== 'New API'
      ? getSystemName()
      : CLASSIC_PREVIEW_STATUS_FALLBACK.system_name);
  const normalizedServerAddress = removeTrailingSlash(serverAddress);
  const normalizedDocsLink = removeTrailingSlash(docsLink);
  const baseHost = getHostname(normalizedServerAddress);
  const isChinese = i18n.language.startsWith('zh');
  const registerEnabled =
    statusState?.status?.register_enabled ??
    CLASSIC_PREVIEW_STATUS_FALLBACK.register_enabled;
  const apiInfo = toSafeArray(statusState?.status?.api_info);
  const announcements = toSafeArray(statusState?.status?.announcements);
  const faqList = toSafeArray(statusState?.status?.faq);
  const chats = toSafeArray(statusState?.status?.chats);

  const text = useMemo(
    () => ({
      badge: isChinese
        ? '统一 OpenAI 兼容 API 接入'
        : 'Unified OpenAI-compatible access',
      titleFirstLine: isChinese ? '面向未来的' : 'One gateway for every',
      titleSecondLine: isChinese ? '统一 AI API 网关' : 'leading AI model',
      subtitle: isChinese
        ? '提供统一、OpenAI 兼容的 API 接口，通过单一入口访问 GPT、Claude、Gemini、国产大模型与多模态能力。'
        : 'Ship against one OpenAI-compatible API and reach GPT, Claude, Gemini, and more from a single entry.',
      ctaPrimary: isChinese ? '立即开始使用' : 'Start now',
      ctaConsole: isChinese ? '进入控制台' : 'Open console',
      ctaRegister: isChinese ? '注册账号' : 'Create account',
      ctaDocs: isChinese ? '查看文档' : 'Read docs',
      ctaAbout: isChinese ? '了解更多' : 'Learn more',
      copySuccess: isChinese ? '已复制到剪贴板' : 'Copied to clipboard',
      routesTitle: isChinese ? '推荐接入线路' : 'Recommended routes',
      routesSubtitle: isChinese
        ? '把用户最需要的入口先放到首页，减少第一次接入时的判断成本。'
        : 'Surface the important routes first so people can connect immediately.',
      routeCopy: isChinese ? '复制地址' : 'Copy URL',
      routeOpen: isChinese ? '打开链接' : 'Open link',
      routePrimary: isChinese ? '主线路' : 'Primary',
      routeOpenAI: isChinese ? 'OpenAI 兼容' : 'OpenAI compatible',
      routeDocs: isChinese ? '快速文档' : 'Quick docs',
      appsTitle: isChinese
        ? '常用客户端与模型生态'
        : 'Clients and model ecosystem',
      appsSubtitle: isChinese
        ? '保留熟悉的 OpenAI 接入方式，同时覆盖常见桌面客户端和主流模型供应商。'
        : 'Keep a familiar OpenAI-style integration path while supporting popular clients and model vendors.',
      clientsLabel: isChinese ? '常用客户端' : 'Popular clients',
      providersLabel: isChinese ? '主流模型供应商' : 'Leading providers',
      announcementsTitle: isChinese ? '最新公告' : 'Latest updates',
      announcementsSubtitle: isChinese
        ? '价格、模型上新和线路变更放在同一处，用户打开首页就能看到。'
        : 'Keep pricing, model, and routing changes visible on the homepage.',
      faqTitle: isChinese ? '接入问答' : 'Getting started FAQ',
      faqSubtitle: isChinese
        ? '首屏只负责建立信任，细节问题继续在这里补足。'
        : 'Use the lower half of the page to answer setup questions without crowding the hero.',
      emptyAnnouncement: isChinese
        ? '暂时还没有公告，可以把模型上新、价格变化和线路维护同步到这里。'
        : 'No updates yet. This space is ideal for pricing, routing, and model change notes.',
      fallbackFaq: [
        {
          id: 'faq-1',
          question: isChinese
            ? '如何开始接入？'
            : 'How do I start integrating?',
          answer: isChinese
            ? '先复制首页展示的接入地址，再进入控制台创建密钥，最后把 Base URL 和 API Key 填进你使用的客户端。'
            : 'Copy the base URL, create a key in the console, then paste the Base URL and API key into your client.',
        },
        {
          id: 'faq-2',
          question: isChinese
            ? '支持哪些客户端？'
            : 'Which clients are supported?',
          answer: isChinese
            ? '大多数 OpenAI 兼容客户端都可以直接接入，包括 Cherry Studio、CC Switch、LobeChat 等常见工具。'
            : 'Most OpenAI-compatible clients work directly here, including Cherry Studio, CC Switch, and LobeChat.',
        },
        {
          id: 'faq-3',
          question: isChinese ? '详细文档在哪里？' : 'Where are the full docs?',
          answer: docsLink
            ? isChinese
              ? `完整说明请查看 [配置文档](${docsLink})。`
              : `See the [setup docs](${docsLink}) for the full guide.`
            : isChinese
              ? '完整说明请在站点文档页中查看。'
              : 'See the documentation page for the full guide.',
        },
      ],
    }),
    [docsLink, isChinese],
  );

  const routeCards = useMemo(() => {
    if (apiInfo.length > 0) {
      return apiInfo
        .map((item, index) => ({
          id: item.id || `route-${index}`,
          route: getRouteDisplayText(item),
          description: toSafeString(item.description),
          url: removeTrailingSlash(toSafeString(item.url)),
          color: item.color || 'grey',
        }))
        .filter((item) => item.route || item.url);
    }

    const fallbackRoutes = [
      {
        id: 'default-route',
        route: baseHost || text.routePrimary,
        description: text.routePrimary,
        url: normalizedServerAddress,
        color: 'grey',
      },
      {
        id: 'openai-route',
        route: `${baseHost || 'api'}/v1`,
        description: text.routeOpenAI,
        url: `${normalizedServerAddress}/v1`,
        color: 'blue',
      },
      {
        id: 'docs-route',
        route: normalizedDocsLink
          ? getHostname(normalizedDocsLink)
          : `${baseHost || 'new-api'}/about`,
        description: normalizedDocsLink ? text.routeDocs : text.ctaAbout,
        url: normalizedDocsLink || `${normalizedServerAddress}/about`,
        color: 'green',
      },
    ];

    return fallbackRoutes.filter((item) => item.url);
  }, [
    apiInfo,
    baseHost,
    normalizedDocsLink,
    normalizedServerAddress,
    text.ctaAbout,
    text.routeDocs,
    text.routeOpenAI,
    text.routePrimary,
  ]);

  const heroRoutes = useMemo(() => routeCards.slice(0, 1), [routeCards]);
  const displayRouteCards = useMemo(() => routeCards.slice(0, 1), [routeCards]);

  const announcementItems = useMemo(
    () =>
      announcements.slice(0, 4).map((item, index) => ({
        id: item.id || `announcement-${index}`,
        content: toSafeMarkedHtml(item?.content),
        relative: getRelativeTime(item.publishDate),
        time: item.publishDate
          ? new Date(item.publishDate).toLocaleString()
          : '',
      })),
    [announcements],
  );

  const faqItems = useMemo(
    () => (faqList.length > 0 ? faqList.slice(0, 6) : text.fallbackFaq),
    [faqList, text.fallbackFaq],
  );

  const appItems = useMemo(() => {
    const parsedApps = chats.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return [];
      }

      return Object.entries(item).map(([name, url]) => ({
        name: toSafeString(name),
        url: toSafeString(url),
      }));
    });

    if (parsedApps.length > 0) {
      return parsedApps.slice(0, 8);
    }

    return [
      { name: 'Cherry Studio' },
      { name: 'CC Switch' },
      { name: 'LobeChat' },
      { name: 'DeepChat' },
      { name: 'OpenCat' },
      { name: 'AionUI' },
    ];
  }, [chats]);

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');

    try {
      const res = await API.get('/api/home_page_content', {
        skipErrorHandler: true,
      });
      const { success, message, data } = res.data;

      if (success) {
        let content = toSafeString(data);

        if (!isRemoteUrl(content)) {
          content = toSafeMarkedHtml(content);
        }

        setHomePageContent(content);
        localStorage.setItem('home_page_content', content);

        if (isRemoteUrl(content)) {
          const iframe = document.querySelector('iframe');

          if (iframe) {
            iframe.onload = () => {
              iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
              iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
            };
          }
        }
      } else {
        if (message) {
          console.warn('[Home] Home page content request returned:', message);
        }
        setHomePageContent('');
      }
    } catch (error) {
      console.error('[Home] Failed to load home page content:', error);
      setHomePageContent('');
    }

    setHomePageContentLoaded(true);
  };

  const handleCopyText = async (value) => {
    const ok = await copy(value);

    if (ok) {
      showSuccess(text.copySuccess);
    }
  };

  const handleOpenExternal = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();

      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice', {
            skipErrorHandler: true,
          });
          const { success, data } = res.data;

          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('Failed to fetch notice:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  const shouldRenderDefaultHome =
    (!homePageContentLoaded && !homePageContent) ||
    (homePageContentLoaded && homePageContent === '');

  return (
    <div className='classic-page-fill classic-home-page w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />

      {shouldRenderDefaultHome ? (
        <div className='classic-home-default classic-home-reference-page w-full overflow-x-hidden'>
          <section className='classic-home-reference-hero border-b border-semi-color-border'>
            <div className='classic-home-hero-shell mx-auto flex w-full max-w-7xl items-center justify-center px-4 pt-16 pb-14 md:px-6 md:pt-20 md:pb-16'>
              <div className='flex w-full max-w-4xl flex-col items-center text-center'>
                <div className='classic-home-brand-mark mb-6 md:mb-8'>
                  <div className='classic-home-brand-name'>{systemName}</div>
                </div>

                <Tag
                  color='white'
                  shape='circle'
                  className='classic-home-hero-badge !mb-6 !border !border-slate-200 !bg-white/80 !px-4 !py-1.5 !text-sm !text-slate-600 shadow-sm'
                >
                  <div className='flex items-center gap-2'>
                    <span className='classic-home-hero-badge-dot' />
                    <span>{text.badge}</span>
                  </div>
                </Tag>

                <div className='mx-auto max-w-4xl'>
                  <h1 className='classic-home-hero-title'>
                    <span className='classic-home-hero-title-accent'>
                      {text.titleFirstLine}
                    </span>
                    <span className='classic-home-hero-title-muted'>
                      {text.titleSecondLine}
                    </span>
                  </h1>

                  <p className='classic-home-hero-subtitle classic-home-hero-subtitle-gradient mx-auto mt-5 max-w-3xl'>
                    {text.subtitle}
                  </p>
                </div>

                <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
                  <Link to='/console'>
                    <Button
                      theme='solid'
                      type='primary'
                      size={isMobile ? 'default' : 'large'}
                      className='classic-home-hero-btn classic-home-hero-btn-primary'
                    >
                      {text.ctaPrimary}
                    </Button>
                  </Link>

                  {registerEnabled ? (
                    <Link to='/register'>
                      <Button
                        size={isMobile ? 'default' : 'large'}
                        className='classic-home-hero-btn classic-home-hero-btn-secondary'
                        icon={<ArrowRight size={16} />}
                      >
                        {text.ctaRegister}
                      </Button>
                    </Link>
                  ) : docsLink ? (
                    <Button
                      size={isMobile ? 'default' : 'large'}
                      className='classic-home-hero-btn classic-home-hero-btn-secondary'
                      icon={<BookOpen size={16} />}
                      onClick={() => handleOpenExternal(docsLink)}
                    >
                      {text.ctaDocs}
                    </Button>
                  ) : (
                    <Link to='/about'>
                      <Button
                        size={isMobile ? 'default' : 'large'}
                        className='classic-home-hero-btn classic-home-hero-btn-secondary'
                      >
                        {text.ctaAbout}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className='mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14'>
            <div className='mb-5 flex flex-col gap-2 text-center md:mb-8'>
              <div className='classic-home-section-eyebrow'>
                <Network size={16} />
                <span>{text.routesTitle}</span>
              </div>
              <p className='classic-home-section-subtitle'>
                {text.routesSubtitle}
              </p>
            </div>

            <div className='mx-auto grid max-w-xl gap-4 md:grid-cols-1'>
              {displayRouteCards.map((route) => (
                <div
                  key={route.id}
                  className='classic-home-panel classic-home-route-card'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <Tag
                      color={route.color || 'grey'}
                      shape='circle'
                      className='!rounded-full'
                    >
                      {getRouteDisplayText(route)}
                    </Tag>
                    <Button
                      size='small'
                      className='classic-home-plain-action'
                      icon={<IconCopy />}
                      onClick={() => handleCopyText(route.url)}
                    >
                      {text.routeCopy}
                    </Button>
                  </div>

                  <div className='mt-5'>
                    <div className='classic-home-route-url'>{route.url}</div>
                    {route.description ? (
                      <p className='classic-home-card-copy mt-2'>
                        {toSafeString(route.description)}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    size='small'
                    className='classic-home-route-open'
                    icon={<ExternalLink size={14} />}
                    onClick={() => handleOpenExternal(route.url)}
                  >
                    {text.routeOpen}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className='mx-auto w-full max-w-6xl px-4 pb-6 md:px-6 md:pb-10'>
            <div className='classic-home-panel classic-home-ecosystem-panel'>
              <div className='mb-6 flex flex-col gap-2 md:mb-8 md:text-center'>
                <div className='classic-home-section-eyebrow'>
                  <Sparkles size={16} />
                  <span>{text.appsTitle}</span>
                </div>
                <p className='classic-home-section-subtitle'>
                  {text.appsSubtitle}
                </p>
              </div>

              <div className='grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'>
                <div>
                  <div className='classic-home-card-label'>
                    {text.clientsLabel}
                  </div>
                  <div className='mt-4 flex flex-wrap gap-3'>
                    {appItems.map((app) => (
                      <button
                        type='button'
                        key={app.name}
                        className='classic-home-client-pill'
                        onClick={() => {
                          if (app.url) {
                            handleOpenExternal(app.url);
                          }
                        }}
                      >
                        {toSafeString(app.name)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className='classic-home-card-label'>
                    {text.providersLabel}
                  </div>
                  <div className='mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4'>
                    {PROVIDER_ICONS.map((item) => (
                      <div key={item.id} className='classic-home-provider-card'>
                        {item.icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className='mx-auto grid w-full max-w-6xl gap-4 px-4 pb-16 md:px-6 lg:grid-cols-2'>
            <div className='classic-home-panel'>
              <div className='flex items-center gap-2 text-semi-color-text-0'>
                <Bell size={18} />
                <Text strong>{text.announcementsTitle}</Text>
              </div>
              <p className='classic-home-card-copy mt-3'>
                {text.announcementsSubtitle}
              </p>

              {announcementItems.length > 0 ? (
                <div className='mt-5 space-y-3'>
                  {announcementItems.map((item) => (
                    <div key={item.id} className='classic-home-subpanel'>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <div className='classic-home-card-label'>
                          {item.relative || item.time}
                        </div>
                        {item.time ? (
                          <div className='classic-home-card-meta'>
                            {item.time}
                          </div>
                        ) : null}
                      </div>
                      <div
                        className='classic-home-card-copy mt-3'
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className='classic-home-empty-state mt-5'>
                  {text.emptyAnnouncement}
                </div>
              )}
            </div>

            <div className='classic-home-panel'>
              <div className='flex items-center gap-2 text-semi-color-text-0'>
                <HelpCircle size={18} />
                <Text strong>{text.faqTitle}</Text>
              </div>
              <p className='classic-home-card-copy mt-3'>{text.faqSubtitle}</p>

              <Collapse
                accordion
                className='classic-home-faq mt-5 overflow-hidden'
              >
                {faqItems.map((item, index) => (
                  <Collapse.Panel
                    key={item.id || index}
                    header={toSafeString(item.question)}
                    itemKey={`${item.id || index}`}
                  >
                    <div
                      className='classic-home-card-copy'
                      dangerouslySetInnerHTML={{
                        __html: toSafeMarkedHtml(item.answer),
                      }}
                    />
                  </Collapse.Panel>
                ))}
              </Collapse>

              <div className='mt-5 flex flex-wrap gap-3'>
                <Link to='/console'>
                  <Button className='classic-home-plain-action'>
                    {text.ctaConsole}
                  </Button>
                </Link>
                {docsLink ? (
                  <Button
                    className='classic-home-plain-action'
                    icon={<BookOpen size={16} />}
                    onClick={() => handleOpenExternal(docsLink)}
                  >
                    {text.ctaDocs}
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className='classic-page-fill overflow-x-hidden w-full'>
          {isRemoteUrl(homePageContent) ? (
            <iframe
              src={homePageContent}
              className='w-full h-full border-none'
              title={t('Custom Home Page')}
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
