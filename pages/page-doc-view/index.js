const DOCUMENTS = {
  login: require('../../docs/login-doc'),
  captcha: require('../../docs/captcha-doc'),
};

Page({
  data: {
    title: '',
    statusBarHeight: 0,
    navBarHeight: 0,
    richText: '',
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo();
    const statusBarHeight = windowInfo.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44;
    this.setData({ statusBarHeight, navBarHeight });

    const docType = options.doc;
    const doc = DOCUMENTS[docType];
    if (!doc) {
      wx.showToast({ title: '文档不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const html = markdownToHtml(doc.content);
    this.setData({ title: doc.title, richText: html });
  },

  goBack() {
    wx.navigateBack();
  },
});

function markdownToHtml(text) {
  const lines = text.split('\n');
  const html = [];
  let tableRows = [];
  let inCodeBlock = false;
  let codeLines = [];

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function applyInlineFormatting(s) {
    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2rpx 6rpx;border-radius:4rpx;font-size:24rpx;">$1</code>');
    // Bold: **text**
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Images: ![alt](url)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;margin:16rpx 0;display:block;border-radius:8rpx;" />');
    // Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2b7de0;">$1</a>');
    return s;
  }

  function flushTable() {
    if (tableRows.length === 0) return;
    let tableHtml = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:24rpx;color:#666;margin:16rpx 0;">';
    tableRows.forEach((row, idx) => {
      const tag = idx === 0 ? 'th' : 'td';
      const bgStyle = idx === 0 ? ' style="background:#f5f5f5;font-weight:600;color:#333;"' : '';
      const cellsHtml = row.map(c => '<' + tag + bgStyle + '>' + applyInlineFormatting(c) + '</' + tag + '>').join('');
      tableHtml += '<tr>' + cellsHtml + '</tr>';
    });
    tableHtml += '</table>';
    html.push(tableHtml);
    tableRows = [];
  }

  function flushCodeBlock() {
    if (codeLines.length === 0) return;
    const escaped = codeLines.map(escapeHtml).join('<br/>');
    html.push('<pre style="background:#f6f8fa;padding:16rpx;border-radius:8rpx;overflow-x:auto;font-size:24rpx;line-height:1.6;margin:16rpx 0;"><code>' + escaped + '</code></pre>');
    codeLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushTable();
      flushCodeBlock();
      const last = html[html.length - 1];
      if (last && last !== '<br/>') {
        html.push('<br/>');
      }
      continue;
    }

    if (trimmed.startsWith('<h2>')) {
      flushTable();
      html.push(trimmed);
    } else if (trimmed.startsWith('## ')) {
      flushTable();
      flushCodeBlock();
      const title = trimmed.substring(3);
      html.push('<h2>' + applyInlineFormatting(title) + '</h2>');
    } else if (trimmed.startsWith('# ')) {
      flushTable();
      flushCodeBlock();
      const title = trimmed.substring(2);
      html.push('<h2>' + applyInlineFormatting(title) + '</h2>');
    } else if (trimmed.startsWith('|')) {
      const cells = trimmed.split('|').filter(c => c.trim() !== '');
      if (cells.length === 0) continue;
      const isSeparator = cells.every(c => /^[\s-]+$/.test(c));
      if (isSeparator) continue;
      tableRows.push(cells.map(c => c.trim()));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('● ') || trimmed.startsWith('* ')) {
      flushTable();
      flushCodeBlock();
      let content = trimmed.replace(/^[-●*]\s*/, '');
      html.push('<li style="list-style:disc;margin-left:30rpx;margin-bottom:8rpx;">' + applyInlineFormatting(content) + '</li>');
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushTable();
      flushCodeBlock();
      let content = trimmed.replace(/^\d+\.\s*/, '');
      html.push('<li style="list-style:decimal;margin-left:30rpx;margin-bottom:8rpx;">' + applyInlineFormatting(content) + '</li>');
    } else if (trimmed.startsWith('> ')) {
      flushTable();
      flushCodeBlock();
      let content = trimmed.substring(2);
      html.push('<blockquote style="border-left:4rpx solid #2b7de0;padding-left:16rpx;color:#888;margin:16rpx 0;">' + applyInlineFormatting(content) + '</blockquote>');
    } else {
      flushTable();
      flushCodeBlock();
      html.push('<p style="line-height:1.8;margin:8rpx 0;">' + applyInlineFormatting(trimmed) + '</p>');
    }
  }

  flushTable();
  flushCodeBlock();
  return html.join('');
}
