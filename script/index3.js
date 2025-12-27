const DEMO_STORAGE_KEY = 'birthdayConfig';
const REDIRECT_FLAG_KEY = 'hb_recent_redirect_target';
let audio = null;
let cachedConfig = null;
let configPromise = null;

function parseDateString(dateStr) {
    if (!dateStr) {
        return null;
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function isBirthdayExpired(dateStr) {
    const parsed = parseDateString(dateStr);
    if (!parsed) {
        return true;
    }
    return parsed.getTime() <= Date.now();
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
}

function buildEditableSnapshot(data) {
    return {
        name: data.name || '',
        birthdayTime: data.birthdayTime || '',
        ifHaveGift: data.ifHaveGift !== undefined ? !!data.ifHaveGift : true,
        homepageText1: data.homepageText1 || '',
        homepageText2: data.homepageText2 || '',
        blessText: deepClone(data.blessText || {})
    };
}

function mergeDemoConfig(baseData) {
    const mergedData = deepClone(baseData);
    const storedRaw = localStorage.getItem(DEMO_STORAGE_KEY);
    let localData = null;

    if (storedRaw) {
        try {
            localData = JSON.parse(storedRaw);
        } catch (e) {
            console.error('解析localStorage配置失败:', e);
            localStorage.removeItem(DEMO_STORAGE_KEY);
        }
    }

    if (localData) {
        if (isBirthdayExpired(localData.birthdayTime)) {
            localData.birthdayTime = baseData.birthdayTime;
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(localData));
        }
    } else {
        localData = buildEditableSnapshot(baseData);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(localData));
    }

    if (localData) {
        if (localData.name !== undefined) {
            mergedData.name = localData.name;
        }
        if (localData.birthdayTime !== undefined) {
            mergedData.birthdayTime = localData.birthdayTime;
        }
        if (localData.ifHaveGift !== undefined) {
            mergedData.ifHaveGift = !!localData.ifHaveGift;
        }
        if (localData.homepageText1 !== undefined) {
            mergedData.homepageText1 = localData.homepageText1;
        }
        if (localData.homepageText2 !== undefined) {
            mergedData.homepageText2 = localData.homepageText2;
        }
        if (localData.blessText) {
            mergedData.blessText = Object.assign({}, mergedData.blessText || {}, localData.blessText);
        }
    }

    return mergedData;
}

function markRedirectTarget(target) {
    try {
        sessionStorage.setItem(REDIRECT_FLAG_KEY, target);
    } catch (e) {
        console.warn('无法记录页面跳转状态:', e);
    }
}

function consumeRedirectFlag(expected) {
    try {
        const flag = sessionStorage.getItem(REDIRECT_FLAG_KEY);
        if (flag === expected) {
            sessionStorage.removeItem(REDIRECT_FLAG_KEY);
            return true;
        }
    } catch (e) {
        console.warn('无法读取页面跳转状态:', e);
    }
    return false;
}

function loadConfig() {
    if (cachedConfig) {
        return Promise.resolve(cachedConfig);
    }
    if (configPromise) {
        return configPromise;
    }

    configPromise = fetch('config.json', { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) {
                throw new Error('无法读取config.json');
            }
            return response.json();
        })
        .then((data) => {
            if (data.demoMode === true) {
                data = mergeDemoConfig(data);
            } else {
                localStorage.removeItem(DEMO_STORAGE_KEY);
            }
            cachedConfig = data;
            return data;
        })
        .catch((error) => {
            console.error('读取config.json时出错:', error);
            throw error;
        })
        .finally(() => {
            configPromise = null;
        });

    return configPromise;
}

function enforceRouteForIndex3(time) {
    if (consumeRedirectFlag('index3')) {
        return;
    }
    const targetDate = parseDateString(time);
    if (!targetDate) {
        console.warn('生日时间无效，无法校验页面路由');
        return;
    }
    const diff = targetDate.getTime() - Date.now();
    if (diff > 0) {
        if (diff > 10000) {
            markRedirectTarget('index');
            window.location.href = './index.html';
        } else {
            markRedirectTarget('index2');
            window.location.href = './index2.html';
        }
    }
}

function applyConfigToPage(data) {
    if (!data) {
        return;
    }

    // 处理基本信息
    if (data.name) {
        const nameElements = document.querySelectorAll('[data-node-name="name"]');
        nameElements.forEach((el) => {
            if (el) el.innerText = data.name;
        });
    }

    // 处理用户图片
    if (data.userImagePath) {
        const imgElement = document.querySelector('[data-node-name="imagePath"]');
        if (imgElement) {
            imgElement.setAttribute('src', data.userImagePath);
        }
    }

    // 处理祝福文本
    if (data.blessText) {
        const blessText = data.blessText;

        if (blessText.websiteTitle) {
            const titleElement = document.getElementById('website-title');
            if (titleElement) {
                titleElement.textContent = blessText.websiteTitle;
            }
        }

        const fieldMapping = {
            text1: 'text1',
            text2: 'text2',
            text3: 'text3',
            text4: 'text4',
            text5: 'text5',
            text6: 'text6',
            text7: 'text7',
            text8: 'text8',
            text9: 'text9',
            text10: 'text10',
            wishHead: 'wishHead',
            wishText: 'wishText',
            giftText: 'giftText',
            giftButtonText: 'giftButtonText'
        };

        Object.keys(fieldMapping).forEach((configField) => {
            const pageField = fieldMapping[configField];
            const element = document.querySelector(`[data-node-name="${pageField}"]`);
            if (element && blessText[configField]) {
                element.innerText = blessText[configField];
            }
        });
    }

    setupGiftSection(data);
}

function setupGiftSection(data) {
    const giftSection = document.querySelector('.nine');
    const imageViewer = document.getElementById('image-viewer');
    const viewerImage = document.getElementById('viewer-image');
    const overlay = document.querySelector('.viewer-overlay');
    const closeBtn = document.querySelector('.close-btn');
    const replyBtn = document.getElementById('replay');

    function closeImageViewer() {
        if (imageViewer) {
            imageViewer.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    if (!data.ifHaveGift) {
        if (giftSection) {
            giftSection.style.display = 'none';
        }
        closeImageViewer();
        return;
    }

    if (giftSection) {
        giftSection.style.display = '';
    }

    if (replyBtn) {
        replyBtn.onclick = function () {
            if (data.giftImagePath && imageViewer && viewerImage) {
                viewerImage.src = data.giftImagePath;
                imageViewer.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else if (data.githubUrl) {
                window.open(data.githubUrl, '_blank');
            }
        };
    }

    if (overlay) {
        overlay.onclick = closeImageViewer;
    }
    if (closeBtn) {
        closeBtn.onclick = closeImageViewer;
    }

    document.addEventListener('keydown', function handleKeyDown(e) {
        if (e.key === 'Escape' && imageViewer && imageViewer.classList.contains('active')) {
            closeImageViewer();
        }
    });
}

// DOMContentLoaded 事件处理
document.addEventListener('DOMContentLoaded', () => {
    audio = new Audio('music/bgMusic.mp3');
    audio.preload = 'auto';
    audio.play();

    loadConfig()
        .then((data) => {
            enforceRouteForIndex3(data.birthdayTime);
            applyConfigToPage(data);
            setTimeout(() => {
                animationTimeline();
            }, 500);
        })
        .catch((error) => {
            console.error('初始化index3页面失败:', error);
        });
});

// 动画时间轴
const animationTimeline = () => {
    const textBoxChars = document.getElementsByClassName('hbd-chatbox')[0];
    const hbd = document.getElementsByClassName('wish-hbd')[0];

    textBoxChars.innerHTML = `<span>${textBoxChars.innerHTML
        .split('')
        .join('</span><span>')}</span`;

    hbd.innerHTML = `<span>${hbd.innerHTML
        .split('')
        .join('</span><span>')}</span`;

    const ideaTextTrans = {
        opacity: 0,
        y: -20,
        rotationX: 5,
        skewX: '15deg',
    };

    const ideaTextTransLeave = {
        opacity: 0,
        y: 20,
        rotationY: 5,
        skewX: '-15deg',
    };

    const tl = new TimelineMax();

    tl.to('.container', 0.1, {
        visibility: 'visible',
    })
        .from('.one', 0.7, {
            opacity: 0,
            y: 10,
        })
        .from('.two', 0.4, {
            opacity: 0,
            y: 10,
        })
        .to(
            '.one',
            0.7,
            {
                opacity: 0,
                y: 10,
            },
            '+=2.5'
        )
        .to(
            '.two',
            0.7,
            {
                opacity: 0,
                y: 10,
            },
            '-=1'
        )
        .from('.three', 0.7, {
            opacity: 0,
            y: 10,
        })
        .to(
            '.three',
            0.7,
            {
                opacity: 0,
                y: 10,
            },
            '+=2'
        )
        .from('.four', 0.7, {
            scale: 0.2,
            opacity: 0,
        })
        .from('.fake-btn', 0.3, {
            scale: 0.2,
            opacity: 0,
        })
        .staggerTo(
            '.hbd-chatbox span',
            0.5,
            {
                visibility: 'visible',
            },
            0.05
        )
        .to('.fake-btn', 0.1, {
            backgroundColor: '#8FE3B6',
        })
        .to(
            '.four',
            0.5,
            {
                scale: 0.2,
                opacity: 0,
                y: -150,
            },
            '+=0.7'
        )
        .from('.idea-1', 0.7, ideaTextTrans)
        .to('.idea-1', 0.7, ideaTextTransLeave, '+=1.5')
        .from('.idea-2', 0.7, ideaTextTrans)
        .to('.idea-2', 0.7, ideaTextTransLeave, '+=1.5')
        .from('.idea-3', 0.7, ideaTextTrans)
        .to('.idea-3 strong', 0.5, {
            scale: 1.2,
            x: 10,
            backgroundColor: 'rgb(21, 161, 237)',
            color: '#fff',
        })
        .to('.idea-3', 0.7, ideaTextTransLeave, '+=1.5')
        .from('.idea-4', 0.7, ideaTextTrans)
        .to('.idea-4', 0.7, ideaTextTransLeave, '+=1.5')
        .from(
            '.idea-5',
            0.7,
            {
                rotationX: 15,
                rotationZ: -10,
                skewY: '-5deg',
                y: 50,
                z: 10,
                opacity: 0,
            },
            '+=0.5'
        )
        .to(
            '.idea-5 .smiley',
            0.7,
            {
                rotation: 90,
                x: 8,
            },
            '+=0.4'
        )
        .to(
            '.idea-5',
            0.7,
            {
                scale: 0.2,
                opacity: 0,
            },
            '+=2'
        )
        .staggerFrom(
            '.idea-6 span',
            0.8,
            {
                scale: 3,
                opacity: 0,
                rotation: 15,
                ease: Expo.easeOut,
            },
            0.2
        )
        .staggerTo(
            '.idea-6 span',
            0.8,
            {
                scale: 3,
                opacity: 0,
                rotation: -15,
                ease: Expo.easeOut,
            },
            0.2,
            '+=1'
        )
        .staggerFromTo(
            '.baloons img',
            2.5,
            {
                opacity: 0.9,
                y: 1400,
            },
            {
                opacity: 1,
                y: -1000,
            },
            0.2
        )
        .from(
            '.lydia-dp',
            0.5,
            {
                scale: 3.5,
                opacity: 0,
                x: 25,
                y: -25,
                rotationZ: -45,
            },
            '-=2'
        )
        .from('.hat', 0.5, {
            x: -100,
            y: 350,
            rotation: -180,
            opacity: 0,
        })
        .staggerFrom(
            '.wish-hbd span',
            0.7,
            {
                opacity: 0,
                y: -50,
                rotation: 150,
                skewX: '30deg',
                ease: Elastic.easeOut.config(1, 0.5),
            },
            0.1
        )
        .staggerFromTo(
            '.wish-hbd span',
            0.7,
            {
                scale: 1.4,
                rotationY: 150,
            },
            {
                scale: 1,
                rotationY: 0,
                color: '#ff69b4',
                ease: Expo.easeOut,
            },
            0.1,
            'party'
        )
        .from(
            '.wish h5',
            0.5,
            {
                opacity: 0,
                y: 10,
                skewX: '-15deg',
            },
            'party'
        )
        .staggerTo(
            '.eight svg',
            1.5,
            {
                visibility: 'visible',
                opacity: 0,
                scale: 80,
                repeat: 3,
                repeatDelay: 1.4,
            },
            0.3
        )
        .to('.six', 0.5, {
            opacity: 0,
            y: 30,
            zIndex: '-1',
        })
        .staggerFrom('.nine p', 1, ideaTextTrans, 1.2)
        .to(
            '.last-smile',
            0.5,
            {
                rotation: 90,
            },
            '+=1'
        );
}