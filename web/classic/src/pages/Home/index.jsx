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
import { Button, Typography } from '@douyinfe/semi-ui';
import {
  IconBookStroked,
  IconExternalOpenStroked,
  IconPlay,
} from '@douyinfe/semi-icons';
import { marked } from 'marked';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import NoticeModal from '../../components/layout/NoticeModal';

const { Paragraph, Text } = Typography;

const Home = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();

  const systemName = statusState?.status?.system_name || '柒';
  const docsLink = statusState?.status?.docs_link || '';
  const brandLogo = statusState?.status?.logo || '';

  const isRemoteHomePage = useMemo(
    () => homePageContent.startsWith('https://'),
    [homePageContent],
  );

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    try {
      const res = await API.get('/api/home_page_content');
      const { success, message, data } = res.data;

      if (!success) {
        showError(message);
        setHomePageContent('');
        return;
      }

      const content = data.startsWith('https://') ? data : marked.parse(data);
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
    } catch (error) {
      showError(t('Failed to load home page content'));
      setHomePageContent('');
    } finally {
      setHomePageContentLoaded(true);
    }
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate === today) {
        return;
      }

      try {
        const res = await API.get('/api/notice');
        const { success, data } = res.data;
        if (success && data && data.trim() !== '') {
          setNoticeVisible(true);
        }
      } catch (error) {
        console.error('failed to load notice', error);
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  return (
    <div className='classic-page-fill classic-home-page w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />

      {homePageContentLoaded && homePageContent === '' ? (
        <section className='classic-home-showcase'>
          <div className='classic-home-showcase__grid' />
          <div className='classic-home-showcase__glow classic-home-showcase__glow--primary' />
          <div className='classic-home-showcase__glow classic-home-showcase__glow--secondary' />

          <div className='classic-home-showcase__inner'>
            <div className='classic-home-showcase__brand'>
              {brandLogo ? (
                <img
                  alt={systemName}
                  className='classic-home-showcase__brand-logo'
                  src={brandLogo}
                />
              ) : null}
              <div className='classic-home-showcase__brand-name'>{systemName}</div>
            </div>

            <div className='classic-home-showcase__badge'>
              <span className='classic-home-showcase__badge-dot' />
              <span>统一 OpenAI 兼容 API 接入</span>
            </div>

            <h1 className='classic-home-showcase__title'>
              面向未来的
              <br />
              统一 AI API 网关
            </h1>

            <Paragraph className='classic-home-showcase__description'>
              提供统一、OpenAI 兼容的 API 接口，通过单一入口访问 GPT、Claude、
              Gemini、国产大模型与多模态能力。
            </Paragraph>

            <div className='classic-home-showcase__actions'>
              <Link to='/console'>
                <Button
                  theme='solid'
                  type='primary'
                  size={isMobile ? 'default' : 'large'}
                  icon={<IconPlay />}
                  className='classic-home-showcase__primary-button'
                >
                  立即开始使用
                </Button>
              </Link>
              {docsLink ? (
                <Button
                  size={isMobile ? 'default' : 'large'}
                  icon={
                    docsLink.startsWith('http') ? (
                      <IconExternalOpenStroked />
                    ) : (
                      <IconBookStroked />
                    )
                  }
                  className='classic-home-showcase__secondary-button'
                  onClick={() => {
                    if (docsLink.startsWith('http')) {
                      window.open(docsLink, '_blank', 'noopener,noreferrer');
                      return;
                    }
                    window.location.href = docsLink;
                  }}
                >
                  查看文档
                </Button>
              ) : null}
            </div>

            <Text className='classic-home-showcase__subnote'>
              兼容主流客户端与统一网关接入场景
            </Text>
          </div>
        </section>
      ) : (
        <div className='classic-page-fill overflow-x-hidden w-full'>
          {isRemoteHomePage ? (
            <iframe
              src={homePageContent}
              className='w-full h-full border-none'
              title='custom-home-page'
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
