/**
 * 樂透刮刮樂吉祥卡 - 核心邏輯 (v0.2)
 */

class ScratchCard {
    constructor(canvasId, options) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.options = Object.assign({
            coverColor: '#CCCCCC',
            brushSize: 30,
            revealPercent: 50,
            onComplete: null
        }, options);

        this.isDrawing = false;
        this.isFinished = false;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.drawCover();
        this.addEventListeners();
    }

    setupCanvas() {
        // 取得容器尺寸
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    drawCover() {
        this.ctx.globalCompositeOperation = 'source-over';
        
        // 建立金色漸層
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#D4AF37'); // Metallic Gold
        gradient.addColorStop(0.5, '#FFD700'); // Gold
        gradient.addColorStop(1, '#B8860B'); // Dark Goldenrod
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 加入雜訊顆粒感
        for (let i = 0; i < 500; i++) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }

        this.ctx.fillStyle = '#614e1a';
        this.ctx.font = 'bold 22px "Microsoft JhengHei"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('刮開領取馬年祝福', this.canvas.width / 2, this.canvas.height / 2);
    }

    addEventListeners() {
        const start = (e) => this.startDrawing(e);
        const move = (e) => this.scratch(e);
        const end = () => this.stopDrawing();

        // Mouse Events
        this.canvas.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);

        // Touch Events
        this.canvas.addEventListener('touchstart', start);
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end);
    }

    getPointerPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    startDrawing(e) {
        if (this.isFinished) return;
        this.isDrawing = true;
        this.scratch(e); // 點擊時就刮除一點
    }

    scratch(e) {
        if (!this.isDrawing || this.isFinished) return;
        if (e.cancelable) e.preventDefault();

        const pos = this.getPointerPos(e);
        
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, this.options.brushSize, 0, Math.PI * 2);
        this.ctx.fill();

        this.checkReveal();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    checkReveal() {
        // 每隔一段時間檢查一次刮開面積 (效能考量)
        if (this.revealCheckTimeout) return;
        
        this.revealCheckTimeout = setTimeout(() => {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const pixels = imageData.data;
            let transparentPixels = 0;

            for (let i = 0; i < pixels.length; i += 4) {
                if (pixels[i + 3] < 128) { // Alpha 通道小於 128 視為透明
                    transparentPixels++;
                }
            }

            const percent = (transparentPixels / (pixels.length / 4)) * 100;
            if (percent >= this.options.revealPercent) {
                this.revealAll();
            }
            this.revealCheckTimeout = null;
        }, 100);
    }

    revealAll() {
        this.isFinished = true;
        this.canvas.style.transition = 'opacity 0.5s';
        this.canvas.style.opacity = '0';
        setTimeout(() => {
            this.canvas.style.display = 'none';
            if (this.options.onComplete) this.options.onComplete();
        }, 500);
    }

    reset() {
        this.isFinished = false;
        this.canvas.style.display = 'block';
        this.canvas.style.opacity = '1';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCover();
    }
}

// App 初始化
document.addEventListener('DOMContentLoaded', () => {
    const prizes = [
        "馬上幸福",
        "馬上幸運",
        "馬年如意",
        "馬年大吉",
        "龍馬精神",
        "馬年亨通",
        "馬上乖乖"
    ];

    const prizeText = document.getElementById('prize-text');
    const btnReset = document.getElementById('btn-reset');
    const btnShare = document.getElementById('btn-share');
    const linkFeedback = document.getElementById('link-feedback');

    let currentPrize = "";

    const sc = new ScratchCard('scratch-canvas', {
        coverColor: '#C0C0C0',
        brushSize: 20,
        revealPercent: 40,
        onComplete: () => {
            console.log('Scratch completed!');
            btnShare.style.display = 'inline-block';
        }
    });

    const setRandomPrize = () => {
        const randomIndex = Math.floor(Math.random() * prizes.length);
        currentPrize = prizes[randomIndex];
        prizeText.innerText = currentPrize;
        btnShare.style.display = 'none'; // 重新刮時先隱藏分享按鈕
    };

    // 分享功能實作
    const sharePrize = async () => {
        const shareData = {
            title: '401 企鵝馬年刮刮樂',
            text: `我在 401 企鵝馬年刮刮樂刮中了：「${currentPrize}」！快來試試你的手氣吧！`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: 複製到剪貼簿
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert('吉祥話已複製到剪貼簿，快去分享給好友吧！');
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    // 初始設定一個獎項
    setRandomPrize();

    btnReset.addEventListener('click', () => {
        setRandomPrize();
        sc.reset();
    });

    btnShare.addEventListener('click', sharePrize);

    linkFeedback.addEventListener('click', (e) => {
        e.preventDefault();
        const feedback = prompt('請輸入您的意見與建議：');
        if (feedback) {
            alert('感謝您的回饋！我們已收到您的意見。');
            console.log('User Feedback:', feedback);
        }
    });
});
