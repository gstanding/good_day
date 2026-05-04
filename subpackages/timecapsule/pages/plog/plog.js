// subpackages/timecapsule/pages/plog/plog.js
const capsuleService = require('../../utils/capsuleService');
const util = require('../../utils/util');

const MOCK_AUDIO = 'https://down.ear0.com:3321/preview?soundid=37418&type=mp3';

const GRADIENTS = [
  'linear-gradient(135deg, #FFB088 0%, #FF6B6B 50%, #4A4E69 100%)',
  'linear-gradient(135deg, #F4A261 0%, #E76F51 60%, #2A2A3E 100%)',
  'linear-gradient(135deg, #FFB4A2 0%, #B5838D 50%, #3A2A40 100%)',
  'linear-gradient(135deg, #6A89CC 0%, #2C3E50 50%, #0F1419 100%)',
  'linear-gradient(135deg, #A8DADC 0%, #457B9D 50%, #1D3557 100%)',
  'linear-gradient(135deg, #C9B1FF 0%, #7868E6 50%, #1A1A2E 100%)',
];

Page({
  data: {
    capsules: [],
    markers: [],
    polyline: [],
    mapLat: 0,
    mapLng: 0,
    currentIndex: -1,
    currentCapsule: null,
    isPlaying: false,
    progress: 0,
    isEmpty: false,
    waveformBars: [],
    totalLabel: '00',
    tickAngles: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
  },

  onLoad(options) {
    const lat = parseFloat(options.lat);
    const lng = parseFloat(options.lng);
    const radius = parseInt(options.radius) || 1000;

    const raw = capsuleService.findNearbyCapsules(lat, lng, radius);
    if (!raw.length) {
      this.setData({ isEmpty: true });
      return;
    }

    const capsules = raw
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c, i) => {
        const d = new Date(c.createdAt);
        const h = d.getHours();
        const m = d.getMinutes();
        const hh = h < 10 ? '0' + h : h;
        const mm = m < 10 ? '0' + m : m;
        const mo = d.getMonth() + 1;
        const dy = d.getDate();
        return {
          ...c,
          timeOnly: `${hh}:${mm}`,
          capDateLabel: `${mo}月${dy}日 · ${hh}:${mm}`,
          durationStr: this.formatDuration(c.duration),
          bgGradient: c.imagePath ? '' : GRADIENTS[i % GRADIENTS.length],
          indexLabel: String(i + 1).padStart(2, '0'),
        };
      });

    // Build waveform bar data with staggered phases
    const barCount = 36;
    const waveformBars = Array.from({ length: barCount }, (_, i) => {
      const seed = Math.sin(i * 1.2) * Math.cos(i * 0.7);
      const base = Math.abs(seed) * 0.6 + 0.2;
      const center = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
      const h = Math.max(6, Math.round((base * 0.5 + center * 0.5) * 52));
      return { h, delay: parseFloat((-i * 0.045).toFixed(3)) };
    });

    this.setData({
      capsules,
      waveformBars,
      totalLabel: String(capsules.length).padStart(2, '0'),
    });

    this.initAudio();
    this.playIndex(0);
  },

  onReady() {
    this._initMiniMap();
  },

  onUnload() {
    if (this.audio) {
      this.audio.stop();
      this.audio.destroy();
    }
    this._clearProgressTimer();
    this._stopPulseAnimation();
  },

  initAudio() {
    this.audio = wx.createInnerAudioContext();

    this.audio.onPlay(() => {
      this.setData({ isPlaying: true });
      this._startProgressTimer();
    });

    this.audio.onPause(() => {
      this.setData({ isPlaying: false });
      this._clearProgressTimer();
    });

    this.audio.onStop(() => {
      this.setData({ isPlaying: false, progress: 0 });
      this._clearProgressTimer();
    });

    this.audio.onEnded(() => {
      this._clearProgressTimer();
      this.setData({ progress: 100 });
      setTimeout(() => {
        this.playIndex(this.data.currentIndex + 1);
      }, 600);
    });

    this.audio.onError(() => {
      wx.showToast({ title: '播放失败，跳过', icon: 'none' });
      setTimeout(() => this.playIndex(this.data.currentIndex + 1), 1500);
    });
  },

  _startProgressTimer() {
    this._clearProgressTimer();
    this._progressTimer = setInterval(() => {
      const dur = this.audio.duration;
      const cur = this.audio.currentTime;
      if (dur && dur > 0) {
        this.setData({ progress: Math.min(100, (cur / dur) * 100) });
      }
    }, 300);
  },

  _clearProgressTimer() {
    if (this._progressTimer) {
      clearInterval(this._progressTimer);
      this._progressTimer = null;
    }
  },

  playIndex(index) {
    const { capsules } = this.data;
    if (index < 0 || index >= capsules.length) {
      if (this.audio) this.audio.stop();
      this.setData({ isPlaying: false, currentIndex: -1, currentCapsule: null, progress: 0 });
      return;
    }
    const c = capsules[index];
    this.audio.src = c.isMock ? MOCK_AUDIO : c.filePath;
    this.audio.play();
    this.setData({
      currentIndex: index,
      currentCapsule: c,
      progress: 0,
    });
  },

  togglePlay() {
    if (this.data.currentIndex === -1) {
      this.playIndex(0);
      return;
    }
    if (this.data.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
  },

  prevCapsule() {
    this.playIndex(this.data.currentIndex - 1);
  },

  nextCapsule() {
    this.playIndex(this.data.currentIndex + 1);
  },

  shareToOA() {
    const { capsules } = this.data;
    wx.shareToOfficialAccount({
      title: `我的旅行声音记录 · ${capsules.length} 个声音胶囊`,
      path: '/subpackages/timecapsule/pages/map/map',
      success: () => wx.showToast({ title: '已发布', icon: 'success' }),
      fail: () => wx.showToast({ title: '发布失败', icon: 'none' })
    });
  },

  // ── Poster sharing ──────────────────────────────────────

  sharePoster() {
    wx.showLoading({ title: '生成海报中...', mask: true });
    this._generatePoster()
      .then(path => {
        wx.hideLoading();
        wx.showShareImageMenu({
          path,
          fail: () => wx.showToast({ title: '分享失败', icon: 'none' })
        });
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '生成失败', icon: 'none' });
      });
  },

  _generatePoster() {
    return new Promise((resolve, reject) => {
      const W = 375, H = 667;
      const dpr = wx.getSystemInfoSync().pixelRatio || 2;
      wx.createSelectorQuery().in(this)
        .select('#poster-canvas')
        .fields({ node: true, size: true })
        .exec(res => {
          if (!res[0] || !res[0].node) { reject(new Error('canvas not found')); return; }
          const canvas = res[0].node;
          canvas.width = Math.round(W * dpr);
          canvas.height = Math.round(H * dpr);
          const ctx = canvas.getContext('2d');
          ctx.scale(dpr, dpr);
          this._renderPoster(ctx, W, H);
          wx.canvasToTempFilePath({
            canvas,
            success: r => resolve(r.tempFilePath),
            fail: reject,
          });
        });
    });
  },

  _renderPoster(ctx, W, H) {
    const { capsules } = this.data;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#09111f');
    bg.addColorStop(0.5, '#0f1c2e');
    bg.addColorStop(1, '#090f1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Top label
    ctx.fillStyle = '#FF6B6B';
    ctx.font = '500 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('声 音 旅 程', W / 2, 34);

    // Red accent line under label
    const lineGrad = ctx.createLinearGradient(32, 0, W - 32, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, 'rgba(255,107,107,0.55)');
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(32, 50);
    ctx.lineTo(W - 32, 50);
    ctx.stroke();

    // Route map
    const mapX = 20, mapY = 66, mapW = W - 40, mapH = 250;
    this._drawPosterRoute(ctx, mapX, mapY, mapW, mapH);

    // Divider after map
    const divY = mapY + mapH + 20;
    const divGrad = ctx.createLinearGradient(32, 0, W - 32, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, divY);
    ctx.lineTo(W - 32, divY);
    ctx.stroke();

    // Count
    const statsY = divY + 16;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 68px sans-serif';
    ctx.fillText(String(capsules.length), W / 2, statsY + 62);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '16px sans-serif';
    ctx.fillText('个声音胶囊', W / 2, statsY + 86);

    // Capsule list (up to 3)
    const listY = statsY + 116;
    const showCount = Math.min(capsules.length, 3);
    for (let i = 0; i < showCount; i++) {
      const c = capsules[i];
      const rowY = listY + i * 30;
      // Small dot
      ctx.beginPath();
      ctx.arc(W / 2 - 88, rowY - 5, 3, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#FF6B6B' : 'rgba(255,255,255,0.28)';
      ctx.fill();
      // Time
      ctx.textAlign = 'left';
      ctx.fillStyle = i === 0 ? 'rgba(255,107,107,0.8)' : 'rgba(255,255,255,0.32)';
      ctx.font = '11px sans-serif';
      ctx.fillText(c.timeOnly || '', W / 2 - 78, rowY - 3);
      // Title
      ctx.fillStyle = i === 0 ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.48)';
      ctx.font = '13px sans-serif';
      const title = c.title.length > 14 ? c.title.slice(0, 14) + '…' : c.title;
      ctx.fillText(title, W / 2 - 78, rowY + 13);
    }
    if (capsules.length > 3) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.font = '11px sans-serif';
      ctx.fillText(`还有 ${capsules.length - 3} 个声音...`, W / 2, listY + showCount * 30 + 10);
    }

    // Bottom branding
    const brandDivY = H - 68;
    const brandGrad = ctx.createLinearGradient(32, 0, W - 32, 0);
    brandGrad.addColorStop(0, 'transparent');
    brandGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    brandGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = brandGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, brandDivY);
    ctx.lineTo(W - 32, brandDivY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = '13px sans-serif';
    ctx.fillText('好日子 · 声音胶囊', W / 2, H - 44);

    const dateStr = capsules.length > 0 ? (capsules[0].capDateLabel || '').split('·')[0].trim() : '';
    if (dateStr) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '11px sans-serif';
      ctx.fillText(dateStr, W / 2, H - 26);
    }
  },

  _drawPosterRoute(ctx, x, y, w, h) {
    const { capsules } = this.data;
    if (!capsules.length) return;

    const lats = capsules.map(c => c.latitude);
    const lngs = capsules.map(c => c.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const pad = 24;
    const rangeH = maxLat - minLat || 0.0001;
    const rangeW = maxLng - minLng || 0.0001;

    const pts = capsules.map(c => ({
      x: x + pad + ((c.longitude - minLng) / rangeW) * (w - pad * 2),
      y: y + pad + (1 - (c.latitude - minLat) / rangeH) * (h - pad * 2),
    }));

    if (pts.length === 1) {
      [24, 14, 7].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,107,107,${0.1 + i * 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6B6B';
      ctx.fill();
      return;
    }

    // Glow pass
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,107,107,0.1)';
    ctx.lineWidth = 12;
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Dashed ghost (full path reference)
    ctx.beginPath();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = 'rgba(74,144,226,0.35)';
    ctx.lineWidth = 1.5;
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Solid red route
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Dots
    ctx.setLineDash([]);
    pts.forEach((p, i) => {
      const isLast = i === pts.length - 1;
      if (isLast) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,107,107,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, isLast ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6B6B';
      ctx.fill();
    });
  },

  // ── Canvas mini-map ──────────────────────────────────────

  _initMiniMap() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this)
      .select('#mini-map-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const w = res[0].width;
        const h = res[0].height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        this._mapCanvas = canvas;
        this._mapCtx = ctx;
        this._mapW = w;
        this._mapH = h;
        if (this.data.currentIndex >= 0) {
          this._startPulseAnimation();
        }
      });
  },

  _computeMapPoints() {
    const { capsules } = this.data;
    if (!capsules.length || !this._mapW) return [];
    const lats = capsules.map(c => c.latitude);
    const lngs = capsules.map(c => c.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const pad = 10;
    const rangeH = maxLat - minLat || 0.0001;
    const rangeW = maxLng - minLng || 0.0001;
    const w = this._mapW, h = this._mapH;
    return capsules.map(c => ({
      x: pad + ((c.longitude - minLng) / rangeW) * (w - pad * 2),
      y: pad + (1 - (c.latitude - minLat) / rangeH) * (h - pad * 2),
    }));
  },

  _drawMiniMap(activeIndex, pulsePhase) {
    if (!this._mapCtx) return;
    const ctx = this._mapCtx;
    const w = this._mapW, h = this._mapH;

    ctx.clearRect(0, 0, w, h);

    // Dark background
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#1a2332');
    bg.addColorStop(1, '#0f1620');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const pts = this._computeMapPoints();
    if (!pts.length) return;

    // Full route — dashed blue
    ctx.beginPath();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = 'rgba(74,144,226,0.5)';
    ctx.lineWidth = 1;
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Active route — solid red up to current capsule
    if (activeIndex >= 0) {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= activeIndex && i < pts.length; i++) {
        i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }

    // Pulsing ring behind active dot
    if (activeIndex >= 0 && activeIndex < pts.length && pulsePhase !== undefined) {
      const p = pts[activeIndex];
      const t = (Math.sin(pulsePhase) + 1) / 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5 + t * 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,107,107,${0.6 * (1 - t)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Dots for each capsule
    ctx.setLineDash([]);
    pts.forEach((p, i) => {
      const isActive = i === activeIndex;
      const isPast = i <= activeIndex;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isActive ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isPast ? '#FF6B6B' : 'rgba(74,144,226,0.5)';
      ctx.fill();
    });
  },

  _startPulseAnimation() {
    this._stopPulseAnimation();
    let phase = 0;
    const tick = () => {
      phase += 0.08;
      this._drawMiniMap(this.data.currentIndex, phase);
      if (this._mapCanvas) {
        this._pulseRAF = this._mapCanvas.requestAnimationFrame(tick);
      }
    };
    if (this._mapCanvas) {
      this._pulseRAF = this._mapCanvas.requestAnimationFrame(tick);
    }
  },

  _stopPulseAnimation() {
    if (this._mapCanvas && this._pulseRAF) {
      this._mapCanvas.cancelAnimationFrame(this._pulseRAF);
      this._pulseRAF = null;
    }
  },

  // ── Markers (kept for potential future use) ──────────────

  _buildMarkers(activeIndex) {
    return this.data.capsules.map((c, i) => {
      const isActive = i === activeIndex;
      const isPast = i < activeIndex;
      const marker = {
        id: i,
        latitude: c.latitude,
        longitude: c.longitude,
        iconPath: '/assets/tape_marker.png',
        width: isActive ? 28 : 16,
        height: isActive ? 28 : 16,
        alpha: isPast ? 0.4 : 1,
      };
      if (isActive) {
        marker.callout = {
          content: c.timeOnly,
          color: '#ffffff',
          bgColor: '#FF6B6B',
          padding: 5,
          borderRadius: 6,
          display: 'ALWAYS',
        };
      }
      return marker;
    });
  },

  formatDuration(seconds) {
    const s = Math.floor(seconds || 0);
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
  },
});
