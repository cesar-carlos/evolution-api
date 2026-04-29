/* eslint-disable */
/**
 * Painel de testes para envio de mensagens interativas (Botões, Lista, Carrossel).
 * Injeta um botão "Testar Interativo" em cada card de instância no manager.
 * Fallback: se nenhum card for detectado, mostra um botão flutuante (FAB).
 */
(function () {
  'use strict';

  if (window.__evoTestInteractive) return;
  window.__evoTestInteractive = true;

  const STYLE = `
    .evo-test-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 10px; margin: 4px;
      font-size: 12px; font-weight: 600; line-height: 1;
      background: #6e44ff; color: #fff; border: none; border-radius: 6px;
      cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,.15);
      transition: background .15s;
    }
    .evo-test-btn:hover { background: #5a36d6; }
    .evo-test-fab {
      position: fixed; right: 24px; bottom: 24px; z-index: 999998;
      padding: 12px 16px; font-size: 14px; font-weight: 700;
      background: #6e44ff; color: #fff; border: none; border-radius: 999px;
      cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.25);
    }
    .evo-test-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.55);
      z-index: 999999; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    .evo-test-modal {
      width: min(720px, 92vw); max-height: 92vh; overflow: auto;
      background: #fff; color: #1a1a1a; border-radius: 12px;
      padding: 20px; box-shadow: 0 12px 40px rgba(0,0,0,.4);
    }
    .evo-test-modal h2 { margin: 0 0 4px; font-size: 18px; }
    .evo-test-modal .evo-sub { color: #666; font-size: 12px; margin-bottom: 14px; }
    .evo-test-tabs { display: flex; gap: 4px; border-bottom: 1px solid #e5e5e5; margin-bottom: 14px; }
    .evo-test-tab {
      padding: 8px 14px; border: none; background: transparent; cursor: pointer;
      font-size: 13px; font-weight: 600; color: #666; border-bottom: 2px solid transparent;
    }
    .evo-test-tab.active { color: #6e44ff; border-color: #6e44ff; }
    .evo-test-form label { display: block; font-size: 12px; font-weight: 600; margin: 10px 0 4px; color: #444; }
    .evo-test-form input, .evo-test-form textarea {
      width: 100%; padding: 8px 10px; border: 1px solid #d0d0d0; border-radius: 6px;
      font-size: 13px; font-family: inherit; box-sizing: border-box;
    }
    .evo-test-form textarea { font-family: ui-monospace, "SF Mono", Consolas, monospace; min-height: 180px; resize: vertical; }
    .evo-test-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .evo-test-actions button {
      padding: 8px 14px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none;
    }
    .evo-test-cancel { background: #eee; color: #333; }
    .evo-test-send { background: #6e44ff; color: #fff; }
    .evo-test-send:disabled { opacity: .6; cursor: not-allowed; }
    .evo-test-toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      padding: 12px 18px; border-radius: 8px; font-size: 13px; color: #fff;
      z-index: 9999999; box-shadow: 0 4px 12px rgba(0,0,0,.3);
    }
    .evo-test-toast.ok { background: #16a34a; }
    .evo-test-toast.err { background: #dc2626; }
    .evo-test-fab-menu {
      position: fixed; right: 24px; bottom: 80px; z-index: 999998;
      background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.2);
      max-height: 320px; overflow: auto; min-width: 220px;
    }
    .evo-test-fab-menu button {
      display: block; width: 100%; padding: 10px 14px; text-align: left;
      border: none; background: transparent; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f0f0f0;
    }
    .evo-test-fab-menu button:hover { background: #f5f3ff; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  // Os tipos de botão NÃO PODEM SER MISTURADOS no mesmo envio.
  // Regras da API:
  //   - reply: 1 a 3 botões, sem misturar com CTA ou PIX
  //   - CTA (url/call/copy): 1 a 2 botões, sem misturar com reply ou PIX
  //   - pix: exatamente 1 botão isolado (payment_info)
  // Por isso há abas separadas.
  const TEMPLATES = {
    reply: {
      number: '',
      title: 'Resposta Rápida',
      description: 'Escolha uma das opções abaixo:',
      footer: 'Evolution API',
      buttons: [
        { type: 'reply', displayText: '✅ Confirmar', id: 'opt_confirm' },
        { type: 'reply', displayText: '❌ Cancelar', id: 'opt_cancel' },
        { type: 'reply', displayText: '🤔 Talvez', id: 'opt_maybe' },
      ],
    },
    cta: {
      number: '',
      title: 'Botões CTA',
      description: 'Botões de URL e copia-código (cta_url + cta_copy):',
      footer: 'Máx. 2 botões CTA por mensagem',
      buttons: [
        { type: 'url', displayText: '🌐 Abrir site', url: 'https://example.com' },
        { type: 'copy', displayText: '📋 Copiar PIX', copyCode: '00020126580014BR.GOV.BCB.PIX0136abc12345-6789-0000-aaaa-bbbbccccdddd5204000053039865802BR5913FULANO DE TAL6009SAO PAULO62070503***6304ABCD' },
      ],
    },
    pix: {
      number: '',
      title: 'Pagamento via PIX',
      description: 'Toque para pagar via PIX (payment_info)',
      footer: 'WhatsApp Pay',
      buttons: [
        {
          type: 'pix',
          currency: 'BRL',
          name: 'Empresa Exemplo',
          keyType: 'random',
          key: 'abc12345-6789-0000-aaaa-bbbbccccdddd',
        },
      ],
    },
    list: {
      number: '',
      title: 'Cardápio de Teste',
      description: 'Escolha um item abaixo',
      footerText: 'Validade hoje',
      buttonText: 'Ver opções',
      sections: [
        {
          title: 'Bebidas',
          rows: [
            { title: 'Coca-Cola', description: 'Lata 350ml', rowId: 'coca' },
            { title: 'Suco de Laranja', description: '300ml natural', rowId: 'suco' },
          ],
        },
        {
          title: 'Lanches',
          rows: [
            { title: 'X-Burger', description: 'Pão, carne 150g, queijo', rowId: 'xburger' },
          ],
        },
      ],
    },
    carousel: {
      number: '',
      body: 'Catálogo da semana',
      cards: [
        {
          body: 'Produto A',
          footer: 'R$ 99,90',
          imageUrl: 'https://picsum.photos/seed/a/600/400',
          buttons: [{ type: 'url', displayText: 'Comprar', url: 'https://exemplo.com/a' }],
        },
        {
          body: 'Produto B',
          footer: 'R$ 149,90',
          imageUrl: 'https://picsum.photos/seed/b/600/400',
          buttons: [{ type: 'url', displayText: 'Comprar', url: 'https://exemplo.com/b' }],
        },
        {
          body: 'Produto C',
          footer: 'R$ 199,90',
          imageUrl: 'https://picsum.photos/seed/c/600/400',
          buttons: [{ type: 'reply', displayText: 'Quero!', id: 'prod_c' }],
        },
      ],
    },
  };

  const ENDPOINT = {
    reply: 'sendButtons',
    cta: 'sendButtons',
    pix: 'sendButtons',
    list: 'sendList',
    carousel: 'sendCarousel',
  };
  const TAB_LABEL = {
    reply: 'Reply',
    cta: 'CTA',
    pix: 'PIX',
    list: 'Lista',
    carousel: 'Carrossel',
  };

  function getApiKey() {
    return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
  }

  function getApiUrl() {
    const u = localStorage.getItem('apiUrl');
    return u && u !== 'undefined' && u !== 'null' ? u.replace(/\/+$/, '') : window.location.origin;
  }

  async function fetchInstances() {
    const apikey = getApiKey();
    if (!apikey) return [];
    try {
      const res = await fetch(getApiUrl() + '/instance/fetchInstances', { headers: { apikey } });
      if (!res.ok) return [];
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.instances || []);
      return list
        .map((it) => {
          const name = it?.name || it?.instanceName || it?.instance?.instanceName;
          const token = it?.token || it?.hash || it?.instance?.hash || it?.apikey;
          return name ? { name, token } : null;
        })
        .filter(Boolean);
    } catch (e) {
      console.error('[evo-test] fetchInstances error', e);
      return [];
    }
  }

  function showToast(msg, type) {
    const el = document.createElement('div');
    el.className = 'evo-test-toast ' + (type || 'ok');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function openModal(instance) {
    const overlay = document.createElement('div');
    overlay.className = 'evo-test-overlay';

    const modal = document.createElement('div');
    modal.className = 'evo-test-modal';

    let activeTab = 'reply';

    const render = () => {
      const tpl = TEMPLATES[activeTab];
      if (!tpl.number) tpl.number = '';

      modal.innerHTML = `
        <h2>Teste Interativo</h2>
        <div class="evo-sub">Instância: <strong>${instance.name}</strong> · Endpoint: <code>POST /message/${ENDPOINT[activeTab]}/${instance.name}</code></div>
        <div class="evo-test-tabs">
          ${Object.keys(ENDPOINT).map((k) => `<button data-tab="${k}" class="evo-test-tab ${k === activeTab ? 'active' : ''}">${TAB_LABEL[k]}</button>`).join('')}
        </div>
        <div class="evo-test-form">
          <label>Número de destino (com DDI/DDD, sem caracteres extras)</label>
          <input class="evo-number" placeholder="5511999999999" value="${tpl.number || ''}" />
          <label>Payload JSON (editável)</label>
          <textarea class="evo-payload"></textarea>
        </div>
        <div class="evo-test-actions">
          <button class="evo-test-cancel">Fechar</button>
          <button class="evo-test-send">Enviar</button>
        </div>
      `;

      const payloadCopy = { ...tpl };
      delete payloadCopy.number;
      modal.querySelector('.evo-payload').value = JSON.stringify(payloadCopy, null, 2);

      modal.querySelectorAll('.evo-test-tab').forEach((btn) => {
        btn.onclick = () => {
          activeTab = btn.dataset.tab;
          render();
        };
      });

      modal.querySelector('.evo-test-cancel').onclick = () => overlay.remove();
      modal.querySelector('.evo-test-send').onclick = async (ev) => {
        const sendBtn = ev.currentTarget;
        const number = (modal.querySelector('.evo-number').value || '').replace(/\D/g, '');
        if (!number) {
          showToast('Informe o número de destino', 'err');
          return;
        }
        let payload;
        try {
          payload = JSON.parse(modal.querySelector('.evo-payload').value);
        } catch (e) {
          showToast('JSON inválido: ' + e.message, 'err');
          return;
        }
        payload.number = number;
        TEMPLATES[activeTab].number = number;

        sendBtn.disabled = true;
        sendBtn.textContent = 'Enviando...';
        try {
          const apikey = instance.token || getApiKey();
          const url = getApiUrl() + '/message/' + ENDPOINT[activeTab] + '/' + encodeURIComponent(instance.name);
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            showToast('Mensagem enviada (id ' + (data?.key?.id || data?.messageId || 'ok') + ')', 'ok');
            overlay.remove();
          } else {
            const msg = data?.response?.message || data?.message || res.statusText;
            showToast('Erro ' + res.status + ': ' + (Array.isArray(msg) ? msg.join('; ') : msg), 'err');
            sendBtn.disabled = false;
            sendBtn.textContent = 'Enviar';
          }
        } catch (e) {
          showToast('Falha de rede: ' + e.message, 'err');
          sendBtn.disabled = false;
          sendBtn.textContent = 'Enviar';
        }
      };
    };

    render();
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  // -- Detector de cards via MutationObserver -----------------------------------

  let knownInstances = [];
  let lastInstanceFetch = 0;

  async function refreshInstancesIfStale() {
    if (Date.now() - lastInstanceFetch > 8000) {
      knownInstances = await fetchInstances();
      lastInstanceFetch = Date.now();
    }
  }

  function findCardForInstance(name) {
    // Procura elementos folha que contenham EXATAMENTE o nome da instância
    const candidates = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.trim() === name) {
        candidates.push(node.parentElement);
      }
    }

    for (const el of candidates) {
      let ancestor = el;
      let depth = 0;
      while (ancestor && depth < 6) {
        const hasButton = ancestor.querySelector('button, a[role="button"]');
        const rect = ancestor.getBoundingClientRect && ancestor.getBoundingClientRect();
        if (hasButton && rect && rect.width > 180 && rect.height > 80) {
          return ancestor;
        }
        ancestor = ancestor.parentElement;
        depth++;
      }
    }
    return null;
  }

  function injectIntoCard(card, instance) {
    if (card.querySelector('.evo-test-btn[data-evo-instance="' + instance.name + '"]')) return;
    const btn = document.createElement('button');
    btn.className = 'evo-test-btn';
    btn.dataset.evoInstance = instance.name;
    btn.type = 'button';
    btn.textContent = '🧪 Testar Interativo';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(instance);
    });
    // injeta perto dos outros botões (no final do card)
    const buttonContainer = card.querySelector('button')?.parentElement || card;
    buttonContainer.appendChild(btn);
    card.dataset.evoTestInjected = '1';
  }

  async function scan() {
    await refreshInstancesIfStale();
    if (!knownInstances.length) return;
    for (const inst of knownInstances) {
      const card = findCardForInstance(inst.name);
      if (card) injectIntoCard(card, inst);
    }
    ensureFab();
  }

  function ensureFab() {
    // Se NENHUM card foi injetado, mostra o FAB. Se houver pelo menos um, remove o FAB.
    const anyInjected = document.querySelector('.evo-test-btn[data-evo-instance]');
    const existingFab = document.querySelector('.evo-test-fab');
    if (anyInjected) {
      existingFab && existingFab.remove();
      return;
    }
    if (existingFab) return;
    const fab = document.createElement('button');
    fab.className = 'evo-test-fab';
    fab.textContent = '🧪 Testar Interativo';
    fab.onclick = () => openFabMenu(fab);
    document.body.appendChild(fab);
  }

  function openFabMenu(fab) {
    document.querySelectorAll('.evo-test-fab-menu').forEach((m) => m.remove());
    if (!knownInstances.length) {
      showToast('Nenhuma instância encontrada. Verifique sua API key.', 'err');
      return;
    }
    const menu = document.createElement('div');
    menu.className = 'evo-test-fab-menu';
    knownInstances.forEach((inst) => {
      const b = document.createElement('button');
      b.textContent = inst.name;
      b.onclick = () => {
        menu.remove();
        openModal(inst);
      };
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    setTimeout(() => {
      const closer = (e) => {
        if (!menu.contains(e.target) && e.target !== fab) {
          menu.remove();
          document.removeEventListener('click', closer);
        }
      };
      document.addEventListener('click', closer);
    }, 0);
  }

  let scanTimer = null;
  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 300);
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, { childList: true, subtree: true });

  // primeira tentativa após 1s para dar tempo do React renderizar
  setTimeout(scan, 1000);
  setTimeout(scan, 3000);
  setInterval(scan, 10000);
})();
