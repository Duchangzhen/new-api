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

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Tag } from '@douyinfe/semi-ui';
import { API, getSystemName } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { CLASSIC_PREVIEW_STATUS_FALLBACK } from '../../constants/previewStatus.constant';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

const isRemoteUrl = (value) => /^https?:\/\//i.test(value);
const toSafeString = (value) =>
  typeof value === 'string' ? value : value == null ? '' : String(value);
const toSafeMarkedHtml = (value) => {
  try {
    return marked.parse(toSafeString(value));
  } catch (error) {
    console.error('[Home] Failed to parse markdown:', error);
    return toSafeString(value);
  }
};

const HOME_DOCS_PATH = '/docs';

const toSafeArray = (value) => (Array.isArray(value) ? value : []);
const toSafeObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const toSafeNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const formatCompactNumber = (value, digits = 6) => {
  const number = toSafeNumber(value);

  if (number === null) {
    return '-';
  }

  return Number(number.toFixed(digits)).toString();
};
const formatRatioDisplay = (value) => formatCompactNumber(value) + 'x';
const getModelGroups = (model) =>
  toSafeArray(model?.enable_groups).filter(Boolean);
const getModelInitials = (name) => {
  const safeName = toSafeString(name).trim();

  if (!safeName) {
    return 'AI';
  }

  const cleaned = safeName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
  return (cleaned || safeName).slice(0, 2).toUpperCase();
};
const getBestGroupForModel = (model, groupRatio) => {
  const groups = getModelGroups(model);

  if (groups.length === 0) {
    return '';
  }

  return groups.reduce((bestGroup, group) => {
    const currentRatio = toSafeNumber(groupRatio[group]) ?? 1;
    const bestRatio = toSafeNumber(groupRatio[bestGroup]) ?? 1;
    return currentRatio < bestRatio ? group : bestGroup;
  }, groups[0]);
};
const getPricingErrorKind = (error) => {
  const status = error?.response?.status;

  if (status === 401 || status === 403) {
    return 'auth';
  }

  return 'error';
};

const Home = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [activeRateCategory, setActiveRateCategory] = useState('all');
  const [pricingState, setPricingState] = useState({
    loading: true,
    models: [],
    groupRatio: {},
    usableGroup: {},
    error: '',
  });
  const effectBoardRef = useRef(null);
  const isMobile = useIsMobile();
  const docsLink = HOME_DOCS_PATH;
  const systemName =
    statusState?.status?.system_name ||
    (getSystemName() && getSystemName() !== 'New API'
      ? getSystemName()
      : CLASSIC_PREVIEW_STATUS_FALLBACK.system_name);
  const isChinese = i18n.language.startsWith('zh');
  const registerEnabled =
    statusState?.status?.register_enabled ??
    CLASSIC_PREVIEW_STATUS_FALLBACK.register_enabled;

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
      routesTitle: isChinese ? 'AI 能量入口' : 'AI energy gateway',
      routesSubtitle: isChinese
        ? '速度、价格和模型阵列放进一个发光控制台，用户往下一滚就能感觉这站很能打。'
        : 'Speed, price, and model access wrapped in one glowing control deck.',
      routeCopy: isChinese ? '复制地址' : 'Copy URL',
      routeOpen: isChinese ? '打开入口' : 'Open gateway',
      routePrimary: isChinese ? '主入口' : 'Primary gateway',
      routeOpenAI: isChinese ? 'OpenAI 兼容' : 'OpenAI compatible',
      routeDocs: isChinese ? '快速文档' : 'Quick docs',
      appsTitle: isChinese ? '模型矩阵全开' : 'Model matrix online',
      appsSubtitle: isChinese
        ? '客户端、模型、Key 全部变成动态展台，先让人觉得帅，再让人想点进去。'
        : 'Clients, models, and keys become a motion stage that feels premium first.',
      clientsLabel: isChinese ? '客户端阵列' : 'Client array',
      providersLabel: isChinese ? '模型轨道' : 'Model orbit',
      announcementsTitle: isChinese ? '充值燃料' : 'Top-up fuel',
      announcementsSubtitle: isChinese
        ? '把充值档位做成能量芯片，视觉先赢一半。'
        : 'Turn top-up levels into luminous energy chips.',
      faqTitle: isChinese ? '启动流程' : 'Launch sequence',
      faqSubtitle: isChinese
        ? '复制入口、注入 Key、启动模型，流程像开机一样直接。'
        : 'Copy the endpoint, inject the key, and launch the model.',
      emptyAnnouncement: isChinese
        ? '0.15 倍率起，支持 10 / 100 / 300 / 648 / 1000 / 5000 元档位，充值后按金额到账。'
        : 'Rates from 0.15x, with 10 / 100 / 300 / 648 / 1000 / 5000 top-up options and clear balance credit.',
      fallbackFaq: [
        {
          id: 'faq-1',
          question: isChinese
            ? '注册后怎么生成 Key？'
            : 'How do I generate an API key?',
          answer: isChinese
            ? '进入控制台后打开令牌页面，点击添加令牌，复制生成的 API Key。Key 只展示一次，建议立即保存。'
            : 'Open the Tokens page in the console, add a token, and copy the generated API key. Save it when it appears.',
        },
        {
          id: 'faq-2',
          question: isChinese
            ? 'Codex 或 Claude Code 怎么接？'
            : 'How do I connect Codex or Claude Code?',
          answer: isChinese
            ? 'Base URL 填首页展示的入口，OpenAI 兼容路径可使用 /v1，API Key 填控制台生成的 Key。'
            : 'Use the homepage Base URL, append /v1 for OpenAI-compatible clients, and paste your console API key.',
        },
        {
          id: 'faq-3',
          question: isChinese
            ? '充值后是怎么到账的？'
            : 'How does top-up credit work?',
          answer: docsLink
            ? isChinese
              ? `按页面选择的金额充值，余额按站内配置到账。完整接入说明请查看 [配置文档](${docsLink})。`
              : `Top up by the selected amount and the balance follows the site configuration. See the [setup docs](${docsLink}) for details.`
            : isChinese
              ? '按页面选择的金额充值，余额按站内配置到账。完整说明请在站点文档页中查看。'
              : 'Top up by the selected amount and the balance follows the site configuration.',
        },
      ],
    }),
    [docsLink, isChinese],
  );

  const rateCategories = useMemo(() => {
    const groupNames = Object.keys(pricingState.usableGroup).filter(Boolean);

    return [
      {
        id: 'all',
        label: isChinese ? '\u5168\u90e8\u6a21\u578b' : 'All models',
        meta: pricingState.models.length
          ? String(pricingState.models.length)
          : isChinese
            ? '\u771f\u5b9e\u63a5\u53e3'
            : 'live',
      },
      ...groupNames.map((group) => ({
        id: group,
        label: group,
        meta: formatRatioDisplay(pricingState.groupRatio[group] ?? 1),
      })),
    ];
  }, [
    isChinese,
    pricingState.groupRatio,
    pricingState.models.length,
    pricingState.usableGroup,
  ]);

  useEffect(() => {
    if (
      activeRateCategory !== 'all' &&
      !rateCategories.some((category) => category.id === activeRateCategory)
    ) {
      setActiveRateCategory('all');
    }
  }, [activeRateCategory, rateCategories]);

  const modelRateCards = useMemo(() => {
    const groupRatio = pricingState.groupRatio;

    return pricingState.models
      .filter((model) => {
        if (activeRateCategory === 'all') {
          return true;
        }

        return getModelGroups(model).includes(activeRateCategory);
      })
      .map((model) => {
        const modelName = toSafeString(model.model_name);
        const selectedGroup =
          activeRateCategory === 'all'
            ? getBestGroupForModel(model, groupRatio)
            : activeRateCategory;
        const selectedGroupRatio = selectedGroup
          ? (toSafeNumber(groupRatio[selectedGroup]) ?? 1)
          : 1;
        const modelRatio = toSafeNumber(model.model_ratio);
        const completionRatio = toSafeNumber(model.completion_ratio);
        const modelPrice = toSafeNumber(model.model_price);
        const quotaType = Number(model.quota_type);
        const isDynamic =
          model.billing_mode === 'tiered_expr' &&
          toSafeString(model.billing_expr);
        const tagList = toSafeString(model.tags)
          .split(/[,;|]/)
          .map((tag) => tag.trim())
          .filter(Boolean);
        const endpointTags = toSafeArray(model.supported_endpoint_types).slice(
          0,
          1,
        );
        const billingLabel =
          quotaType === 1
            ? isChinese
              ? '\u6309\u6b21\u8ba1\u8d39'
              : 'Per use'
            : isChinese
              ? '\u6309\u91cf\u8ba1\u8d39'
              : 'Token billing';
        const rate = isDynamic
          ? isChinese
            ? '\u52a8\u6001\u8ba1\u8d39'
            : 'Dynamic'
          : quotaType === 1
            ? modelPrice === null
              ? billingLabel
              : formatCompactNumber(modelPrice) +
                ' / ' +
                (isChinese ? '\u6b21' : 'use')
            : modelRatio === null
              ? '-'
              : formatRatioDisplay(modelRatio);
        const numericToneValue = quotaType === 1 ? modelPrice : modelRatio;
        const tone =
          numericToneValue !== null && numericToneValue <= 0.3
            ? 'hot'
            : isDynamic
              ? 'dynamic'
              : 'default';
        const groups = getModelGroups(model);
        const description =
          toSafeString(model.description) ||
          (groups.length
            ? (isChinese ? '\u53ef\u7528\u5206\u7ec4' : 'Groups') +
              ': ' +
              groups.join(' / ')
            : isChinese
              ? '\u6309\u540e\u53f0\u771f\u5b9e\u4ef7\u683c\u914d\u7f6e\u5c55\u793a\u3002'
              : 'Loaded from the live pricing configuration.');
        const metaItems = [
          selectedGroup
            ? (isChinese ? '\u5206\u7ec4' : 'Group') +
              ' ' +
              selectedGroup +
              ' ' +
              formatRatioDisplay(selectedGroupRatio)
            : null,
          quotaType === 0 && completionRatio !== null
            ? (isChinese ? '\u8f93\u51fa' : 'Output') +
              ' ' +
              formatRatioDisplay(completionRatio)
            : null,
          billingLabel,
        ].filter(Boolean);

        return {
          id: model.key || modelName,
          name: modelName,
          family: toSafeString(model.vendor_name) || billingLabel,
          rate,
          tone,
          description,
          metaItems,
          tags: [...tagList, ...endpointTags].slice(0, 4),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    activeRateCategory,
    isChinese,
    pricingState.groupRatio,
    pricingState.models,
  ]);

  const visibleModelRateCards = modelRateCards;

  const pricingSummary = useMemo(() => {
    const groupNames = Object.keys(pricingState.usableGroup).filter(Boolean);
    const ratios = groupNames
      .map((group) => toSafeNumber(pricingState.groupRatio[group]))
      .filter((ratio) => ratio !== null);
    const minRatio = ratios.length ? Math.min(...ratios) : null;

    return {
      modelCount: pricingState.models.length,
      groupCount: groupNames.length,
      minRatio,
    };
  }, [
    pricingState.groupRatio,
    pricingState.models.length,
    pricingState.usableGroup,
  ]);

  const effectModelNodes = useMemo(() => {
    const realNodes = modelRateCards.slice(0, 8).map((model) => ({
      id: model.id,
      name: model.name,
      meta: model.rate,
      initials: getModelInitials(model.name),
    }));

    if (realNodes.length > 0) {
      return realNodes;
    }

    const pendingMeta = pricingState.loading
      ? isChinese
        ? '\u8bfb\u53d6\u4e2d'
        : 'Loading'
      : isChinese
        ? '\u7b49\u5f85\u516c\u5f00'
        : 'Waiting';
    const priceMeta =
      pricingSummary.minRatio === null
        ? pendingMeta
        : formatRatioDisplay(pricingSummary.minRatio);
    const fallbackNodes = [
      { id: 'orbit-gpt', name: 'GPT', meta: pendingMeta, initials: 'GPT' },
      {
        id: 'orbit-claude',
        name: 'Claude',
        meta: pendingMeta,
        initials: 'CL',
      },
      {
        id: 'orbit-gemini',
        name: 'Gemini',
        meta: pendingMeta,
        initials: 'GE',
      },
      {
        id: 'orbit-price',
        name: isChinese ? '\u4ef7\u683c' : 'Price',
        meta: priceMeta,
        initials: isChinese ? '\u4ef7' : '$',
      },
    ];

    return fallbackNodes;
  }, [
    isChinese,
    modelRateCards,
    pricingState.loading,
    pricingSummary.minRatio,
  ]);

  const pricingSkeletonCards = useMemo(
    () => Array.from({ length: 6 }, (_, index) => 'pricing-skeleton-' + index),
    [],
  );

  const effectParticles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => {
        const x = (index * 37 + 12) % 100;
        const y = (index * 53 + 18) % 100;
        const size = 3 + (index % 4);
        const duration = 9 + (index % 7);

        return {
          id: `effect-particle-${index}`,
          style: {
            '--px': `${x}%`,
            '--py': `${y}%`,
            '--particle-size': `${size}px`,
            '--particle-delay': `${index * -0.45}s`,
            '--particle-duration': `${duration}s`,
          },
        };
      }),
    [],
  );

  const handleEffectPointerMove = (event) => {
    const board = effectBoardRef.current;

    if (!board) {
      return;
    }

    const rect = board.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    board.style.setProperty('--pointer-x', `${x}%`);
    board.style.setProperty('--pointer-y', `${y}%`);
  };

  const handleEffectPointerLeave = () => {
    const board = effectBoardRef.current;

    if (!board) {
      return;
    }

    board.style.setProperty('--pointer-x', '50%');
    board.style.setProperty('--pointer-y', '48%');
  };

  const loadPricingPreview = async () => {
    setPricingState((previous) => ({
      ...previous,
      loading: true,
      error: '',
    }));

    try {
      const res = await API.get('/api/pricing', { skipErrorHandler: true });
      const payload = res?.data || {};

      if (!payload.success) {
        throw new Error(payload.message || 'Failed to load pricing');
      }

      const vendorMap = {};
      toSafeArray(payload.vendors).forEach((vendor) => {
        if (vendor?.id !== undefined && vendor?.id !== null) {
          vendorMap[vendor.id] = vendor;
        }
      });

      const models = toSafeArray(payload.data)
        .map((model) => {
          const vendor = vendorMap[model?.vendor_id];

          return {
            ...model,
            key: model?.key || model?.model_name,
            vendor_name: model?.vendor_name || vendor?.name || '',
            vendor_icon: model?.vendor_icon || vendor?.icon || '',
          };
        })
        .filter((model) => toSafeString(model.model_name));

      setPricingState({
        loading: false,
        models,
        groupRatio: toSafeObject(payload.group_ratio),
        usableGroup: toSafeObject(payload.usable_group),
        error: '',
      });
    } catch (error) {
      console.warn('[Home] Failed to load pricing preview:', error);
      setPricingState({
        loading: false,
        models: [],
        groupRatio: {},
        usableGroup: {},
        error: getPricingErrorKind(error),
      });
    }
  };

  useEffect(() => {
    loadPricingPreview().then();
  }, []);

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

  const handleOpenExternal = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenRoute = (url) => {
    if (!url) return;
    if (url.startsWith('/') && !url.startsWith('//')) {
      navigate(url);
      return;
    }
    handleOpenExternal(url);
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
          <section className='classic-home-reference-hero'>
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
                      onClick={() => handleOpenRoute(docsLink)}
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

          <section className='classic-home-effect-section mx-auto w-full max-w-[1500px] px-3 py-12 md:px-6 md:py-[72px]'>
            <div
              ref={effectBoardRef}
              className='classic-home-effect-board'
              aria-label='AI model motion'
              onMouseMove={handleEffectPointerMove}
              onMouseLeave={handleEffectPointerLeave}
            >
              <div className='classic-home-effect-grid' />
              <div className='classic-home-effect-light classic-home-effect-light-a' />
              <div className='classic-home-effect-light classic-home-effect-light-b' />
              <div className='classic-home-effect-veil' />
              <div className='classic-home-effect-ribbon classic-home-effect-ribbon-a' />
              <div className='classic-home-effect-ribbon classic-home-effect-ribbon-b' />
              <div className='classic-home-effect-thread classic-home-effect-thread-a' />
              <div className='classic-home-effect-thread classic-home-effect-thread-b' />
              <div className='classic-home-effect-thread classic-home-effect-thread-c' />
              <div className='classic-home-particle-field' aria-hidden='true'>
                {effectParticles.map((particle) => (
                  <span key={particle.id} style={particle.style} />
                ))}
              </div>
              <div className='classic-home-effect-wave classic-home-effect-wave-a' />
              <div className='classic-home-effect-wave classic-home-effect-wave-b' />
              <div className='classic-home-effect-orbit classic-home-effect-orbit-a' />
              <div className='classic-home-effect-orbit classic-home-effect-orbit-b' />
              <div className='classic-home-effect-core'>
                <Sparkles size={30} />
                <strong>
                  {pricingState.loading
                    ? isChinese
                      ? '\u8bfb\u53d6\u4e2d'
                      : 'Loading'
                    : pricingSummary.modelCount || 0}
                </strong>
                <span>
                  {pricingSummary.modelCount
                    ? isChinese
                      ? '\u771f\u5b9e\u6a21\u578b'
                      : 'real models'
                    : isChinese
                      ? '\u7b49\u5f85\u516c\u5f00'
                      : 'waiting'}
                </span>
              </div>
              <div className='classic-home-effect-stat classic-home-effect-stat-a'>
                <span>{isChinese ? '\u5206\u7ec4' : 'Groups'}</span>
                <strong>{pricingSummary.groupCount || 0}</strong>
              </div>
              <div className='classic-home-effect-stat classic-home-effect-stat-b'>
                <span>
                  {isChinese ? '\u6700\u4f4e\u5206\u7ec4' : 'Lowest group'}
                </span>
                <strong>
                  {pricingSummary.minRatio === null
                    ? isChinese
                      ? '\u5f85\u516c\u5f00'
                      : 'Private'
                    : formatRatioDisplay(pricingSummary.minRatio)}
                </strong>
              </div>
              {effectModelNodes.length > 0 ? (
                <div className='classic-home-effect-node-ring'>
                  {effectModelNodes.map((item, index) => {
                    const desktopPositions = [
                      [-318, -112],
                      [96, -188],
                      [282, 18],
                      [-118, 178],
                      [-438, 88],
                      [430, -126],
                      [36, 224],
                      [-468, -158],
                    ];
                    const mobilePositions = [
                      [-92, -94],
                      [78, -82],
                      [92, 70],
                      [-74, 100],
                      [0, -132],
                      [0, 132],
                    ];
                    const nodePosition = (
                      isMobile ? mobilePositions : desktopPositions
                    )[
                      index %
                        (isMobile ? mobilePositions : desktopPositions).length
                    ];

                    return (
                      <div
                        key={item.id}
                        className='classic-home-effect-node'
                        style={{
                          '--x': nodePosition[0] + 'px',
                          '--y': nodePosition[1] + 'px',
                          '--delay': index * 0.08 + 's',
                        }}
                      >
                        <div className='classic-home-effect-node-card'>
                          <span>{item.initials}</span>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.meta}</small>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='classic-home-effect-empty-state'>
                  <span>
                    {pricingState.loading
                      ? isChinese
                        ? '\u6b63\u5728\u8fde\u63a5\u771f\u5b9e\u4ef7\u683c'
                        : 'Connecting live pricing'
                      : isChinese
                        ? '\u4ef7\u683c\u516c\u5f00\u540e\u81ea\u52a8\u70b9\u4eae'
                        : 'Lights up when pricing is public'}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className='classic-home-rate-section mx-auto w-full max-w-6xl px-4 pb-16 md:px-6'>
            <div className='classic-home-rate-heading'>
              <h2>
                {isChinese
                  ? '\u771f\u5b9e\u6a21\u578b\u4e0e\u500d\u7387'
                  : 'Live models and rates'}
              </h2>
              <p>
                {pricingState.loading
                  ? isChinese
                    ? '\u6b63\u5728\u8bfb\u53d6\u4ef7\u683c\u9875\u771f\u5b9e\u914d\u7f6e\uff0c\u4e0d\u5199\u6b7b\u4efb\u4f55\u6a21\u578b\u3002'
                    : 'Loading the live pricing config without hardcoded models.'
                  : pricingState.models.length
                    ? isChinese
                      ? '\u5df2\u8bfb\u53d6 ' +
                        pricingState.models.length +
                        ' \u4e2a\u6a21\u578b\uff0c\u500d\u7387\u5168\u90e8\u6765\u81ea /api/pricing\u3002'
                      : pricingState.models.length +
                        ' models loaded directly from /api/pricing.'
                    : isChinese
                      ? '\u5f53\u524d\u6ca1\u6709\u53ef\u516c\u5f00\u5c55\u793a\u7684\u500d\u7387\u6570\u636e\u3002\u540e\u53f0\u5f00\u542f\u4ef7\u683c\u9875\u516c\u5f00\u6216\u767b\u5f55\u540e\uff0c\u4f1a\u81ea\u52a8\u5c55\u793a\u771f\u5b9e\u6a21\u578b\u3002'
                      : 'No public pricing data is available. Open pricing access or sign in to show live models.'}
              </p>
            </div>

            {rateCategories.length > 1 ? (
              <div className='classic-home-rate-tabs' role='tablist'>
                {rateCategories.map((category) => (
                  <button
                    key={category.id}
                    type='button'
                    className={
                      'classic-home-rate-tab ' +
                      (activeRateCategory === category.id
                        ? 'classic-home-rate-tab-active'
                        : '')
                    }
                    onClick={() => setActiveRateCategory(category.id)}
                  >
                    <span>{category.label}</span>
                    <em>{category.meta}</em>
                  </button>
                ))}
              </div>
            ) : null}

            {pricingState.loading ? (
              <div className='classic-home-model-rate-grid'>
                {pricingSkeletonCards.map((item) => (
                  <article
                    key={item}
                    className='classic-home-model-rate-card classic-home-model-rate-skeleton'
                  >
                    <div className='classic-home-skeleton-line classic-home-skeleton-line-sm' />
                    <div className='classic-home-skeleton-line classic-home-skeleton-line-lg' />
                    <div className='classic-home-skeleton-line' />
                    <div className='classic-home-skeleton-line classic-home-skeleton-line-md' />
                  </article>
                ))}
              </div>
            ) : visibleModelRateCards.length > 0 ? (
              <div className='classic-home-model-rate-grid'>
                {visibleModelRateCards.map((item, index) => (
                  <article
                    key={item.id}
                    className={
                      'classic-home-model-rate-card classic-home-model-rate-card-' +
                      (item.tone || 'default')
                    }
                    style={{ '--delay': index * 0.025 + 's' }}
                  >
                    <div className='classic-home-model-rate-top'>
                      <span className='classic-home-model-family'>
                        {item.family}
                      </span>
                      <span className='classic-home-model-rate'>
                        {item.rate}
                      </span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className='classic-home-model-meta'>
                      {item.metaItems.map((meta) => (
                        <span key={meta}>{meta}</span>
                      ))}
                    </div>
                    {item.tags.length > 0 ? (
                      <div className='classic-home-model-tags'>
                        {item.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className='classic-home-rate-empty'>
                <div>
                  <strong>
                    {pricingState.error === 'auth'
                      ? isChinese
                        ? '\u4ef7\u683c\u9875\u5f53\u524d\u9700\u8981\u767b\u5f55'
                        : 'Pricing currently requires sign-in'
                      : isChinese
                        ? '\u6682\u65e0\u516c\u5f00\u500d\u7387\u6570\u636e'
                        : 'No public rate data'}
                  </strong>
                  <p>
                    {pricingState.error === 'auth'
                      ? isChinese
                        ? '\u8fd9\u662f\u540e\u53f0\u771f\u5b9e\u6743\u9650\u8bbe\u7f6e\u5bfc\u81f4\u7684\uff0c\u4e0d\u4f1a\u518d\u7528\u5047\u6a21\u578b\u5360\u4f4d\u3002\u767b\u5f55\u540e\u6216\u5c06\u4ef7\u683c\u9875\u8bbe\u4e3a\u516c\u5f00\u5373\u53ef\u5c55\u793a\u771f\u5b9e\u500d\u7387\u3002'
                        : 'This follows the real permission setting. Sign in or make pricing public to show live rates.'
                      : isChinese
                        ? '\u63a5\u53e3\u6ca1\u6709\u8fd4\u56de\u6a21\u578b\u65f6\uff0c\u8fd9\u91cc\u4fdd\u6301\u7a7a\u6001\uff0c\u907f\u514d\u5c55\u793a\u4f60\u6ca1\u6709\u914d\u7f6e\u7684\u5185\u5bb9\u3002'
                        : 'When the API returns no models, this stays empty instead of showing fake content.'}
                  </p>
                </div>
                <Link to='/pricing'>
                  <Button className='classic-home-rate-empty-action'>
                    {isChinese
                      ? '\u67e5\u770b\u4ef7\u683c\u9875'
                      : 'Open pricing'}
                  </Button>
                </Link>
              </div>
            )}
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
