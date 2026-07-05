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

import React from 'react';
import SelectableButtonGroup from '../../../common/ui/SelectableButtonGroup';
import { getLobeHubIcon } from '../../../../helpers';

const BYTEDANCE_VENDOR_LABEL = '\u5b57\u8282\u8df3\u52a8';
const VENDOR_LABEL_OVERRIDES = {
  Anthropic: 'Claude',
  Google: 'Gemini',
};
const VENDOR_ORDER = [
  'OpenAI',
  'Anthropic',
  'Claude',
  'Google',
  'Gemini',
  'DeepSeek',
  '\u667a\u8c31',
  'unknown',
];
const getVendorLabel = (vendor, t) =>
  t(VENDOR_LABEL_OVERRIDES[vendor] || vendor);
const getVendorSortIndex = (vendor) => {
  const index = VENDOR_ORDER.indexOf(vendor);
  return index === -1 ? VENDOR_ORDER.length : index;
};

/**
 * 供应商筛选组件
 * @param {string|'all'} filterVendor 当前值
 * @param {Function} setFilterVendor setter
 * @param {Array} models 模型列表
 * @param {Array} allModels 所有模型列表（用于获取全部供应商）
 * @param {boolean} loading 是否加载中
 * @param {Function} t i18n
 */
const PricingVendors = ({
  filterVendor,
  setFilterVendor,
  models = [],
  allModels = [],
  loading = false,
  t,
}) => {
  // 获取系统中所有供应商（基于 allModels，如果未提供则退化为 models）
  const getAllVendors = React.useMemo(() => {
    const vendors = new Set();
    const vendorIcons = new Map();
    let hasUnknownVendor = false;

    (allModels.length > 0 ? allModels : models).forEach((model) => {
      if (model.vendor_name) {
        vendors.add(model.vendor_name);
        if (model.vendor_icon && !vendorIcons.has(model.vendor_name)) {
          vendorIcons.set(model.vendor_name, model.vendor_icon);
        }
      } else {
        hasUnknownVendor = true;
      }
    });

    return {
      vendors: Array.from(vendors).sort(
        (a, b) =>
          getVendorSortIndex(a) - getVendorSortIndex(b) || a.localeCompare(b),
      ),
      vendorIcons,
      hasUnknownVendor,
    };
  }, [allModels, models]);

  // 计算每个供应商的模型数量（基于当前过滤后的 models）
  const getVendorCount = React.useCallback(
    (vendor) => {
      if (vendor === 'all') {
        return models.length;
      }
      if (vendor === 'unknown') {
        return models.filter((model) => !model.vendor_name).length;
      }
      return models.filter((model) => model.vendor_name === vendor).length;
    },
    [models],
  );

  // 生成供应商选项
  const items = React.useMemo(() => {
    const result = [
      {
        value: 'all',
        label: t('全部供应商'),
        tagCount: getVendorCount('all'),
      },
    ];

    // 添加所有已知供应商
    getAllVendors.vendors.forEach((vendor) => {
      const count = getVendorCount(vendor);
      const icon = getAllVendors.vendorIcons.get(vendor);
      result.push({
        value: vendor,
        label: getVendorLabel(vendor, t),
        icon: icon ? getLobeHubIcon(icon, 16) : null,
        tagCount: count,
      });
    });

    // 如果系统中存在未标明供应商，按字节跳动展示
    if (getAllVendors.hasUnknownVendor) {
      const count = getVendorCount('unknown');
      result.push({
        value: 'unknown',
        label: t(BYTEDANCE_VENDOR_LABEL),
        tagCount: count,
      });
    }

    return result;
  }, [getAllVendors, getVendorCount, t]);

  return (
    <SelectableButtonGroup
      title={t('供应商')}
      items={items}
      activeValue={filterVendor}
      onChange={setFilterVendor}
      loading={loading}
      variant='violet'
      t={t}
    />
  );
};

export default PricingVendors;
