// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2024-11-28
// @description  try to take over the world!
// @author       You
// @match        https://adsmanager.facebook.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  // 是否继续detect
  const addElement = (parent, tag, id, style) => {
    const el = document.createElement(tag);
    if (id) {
      el.id = id;
    }
    if (style) {
      el.style = style;
    }
    parent = parent || document.body;
    parent.append(el);
    return el;
  };
  const panel = addElement(
    undefined,
    'div',
    'panel',
    'position:fixed; right: 100px; top: 100px; z-index: 9999; background: #fff; border: 1px solid red; font-size: 16px; font-weight: bold;',
  );
  let toStop = false;
  const adIdListDivId = 'ad-id-list-div';
  const adIdSet = new Set();
  const urlObj = new URL(document.location.href);
  const businessId = urlObj.searchParams.get('business_id');
  const actId = urlObj.searchParams.get('act');
  console.log('business id', businessId, 'act', actId);
  const loadAdIdSet = () => {
    const str = localStorage.getItem(`${businessId}-ad-ids`);
    const adIdList = JSON.parse(str);
    if (adIdList) {
      adIdList.forEach((id) => id && adIdSet.add(id));
    }
  };
  const storeAdIdSet = () => {
    const adIdList = Array.from(adIdSet);
    localStorage.setItem(`${businessId}-ad-ids`, JSON.stringify(adIdList));
  };
  const replaceAdId = (adId) => {
    const url = document.location.href.replace(/act=\w+/, `act=${adId}`);
    return url;
  };
  loadAdIdSet();

  const addSelect = () => {
    const select = addElement(panel, 'select');
    const adIdList = Array.from(adIdSet);
    adIdList.forEach((adId) => {
      const option = document.createElement('option');
      option.innerText = adId;
      option.value = adId;
      select.append(option);
    });
    select.addEventListener('change', function (e) {
      const adId = e.target.value;
      if (adId) {
        const url = replaceAdId(adId);
        document.location.href = url;
      }
    });
    select.value = actId;
  };

  const loopingDetect = () => {
    if (toStop) {
      return;
    } else {
      console.log('---获取ad id list---');
      Array.from(document.querySelectorAll('div [role=row]')).forEach((div) => {
        const divText = div.innerText;
        const matches = divText.match(/ad\saccount\sid:\s(\w+)/i);
        if (matches) {
          const id = matches[1];
          if (id) {
            adIdSet.add(id);
          }
        }
      });
      storeAdIdSet();
      showAdIds();
      setTimeout(loopingDetect, 1000);
    }
  };

  const addDetectButton = () => {
    const button = document.createElement('button');
    button.innerText = '开始获取广告号';
    button.addEventListener(
      'click',
      function (e) {
        loopingDetect();
      },
      true,
    );
    panel.append(button);
  };

  const showAdIds = () => {
    let div = document.getElementById(adIdListDivId);
    if (!div) {
      div = addElement(panel, 'div', adIdListDivId, '');
    }
    div.innerHTML = Array.from(adIdSet)
      .map((id) => `<div style="font-size: 12px;font-weight: normal;">${id}</div>`)
      .join('');
  };

  const addCopyButton = () => {
    const button = addElement(panel, 'button');
    button.innerText = '复制广告号';
    button.addEventListener('click', function (e) {
      const str = Array.from(adIdSet).join('\n');
      navigator.clipboard.writeText(str);
    });
  };

  addDetectButton();
  addCopyButton();
  addSelect();
})();
