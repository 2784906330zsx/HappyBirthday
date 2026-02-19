var NORMAL_LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var ITALIC_LETTERS = '𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡';
var ITALIC_LETTER_ARRAY = Array.from(ITALIC_LETTERS);

function convertToItalicLetters(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    var converted = '';
    for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        var index = NORMAL_LETTERS.indexOf(ch);
        if (index !== -1) {
            converted += ITALIC_LETTER_ARRAY[index];
        } else {
            converted += ch;
        }
    }
    return converted;
}

var DEMO_STORAGE_KEY = 'birthdayConfig';
var REDIRECT_FLAG_KEY = 'hb_recent_redirect_target';

function parseDateString(dateStr) {
    if (!dateStr) {
        return null;
    }
    var parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
        return null;
    }
    return parsed;
}

function isBirthdayExpired(dateStr) {
    var parsed = parseDateString(dateStr);
    if (!parsed) {
        return true;
    }
    return parsed.getTime() <= Date.now();
}

function buildEditableSnapshot(data) {
    return {
        name: data.name || '',
        birthdayTime: data.birthdayTime || '',
        ifHaveGift: data.ifHaveGift !== undefined ? data.ifHaveGift : true,
        homepageText1: data.homepageText1 || '',
        homepageText2: data.homepageText2 || '',
        blessText: $.extend(true, {}, data.blessText || {})
    };
}

function mergeDemoConfig(baseData) {
    var mergedData = $.extend(true, {}, baseData);
    var storedRaw = localStorage.getItem(DEMO_STORAGE_KEY);
    var localData = null;

    if (storedRaw) {
        try {
            localData = JSON.parse(storedRaw);
        } catch (e) {
            console.error('解析localStorage配置失败:', e);
            localStorage.removeItem(DEMO_STORAGE_KEY);
            localData = null;
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
            mergedData.blessText = $.extend(true, {}, mergedData.blessText || {}, localData.blessText);
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

$(function () {
    var order_time = null;
    var activeConfig = null;

    // 添加测试按钮点击事件
    $('#test-demo-btn').on('click', function () {
        $('#demo-mode-container').css({
            'display': 'flex',
            'position': 'fixed',
            'top': '20px',
            'right': '20px',
            'z-index': '1000',
            'background-color': 'rgba(0, 0, 0, 0.5)',
            'padding': '8px 15px',
            'border-radius': '20px'
        });
    });

    // 初始化时隐藏演示模式水印，等待配置加载完成后再决定是否显示
    $('#demo-mode-container').hide();

    // 确保文本和图标样式正确（但不显示）
    $('.demo-mode-text').css({
        'color': '#ffffff',
        'font-size': '14px',
        'margin-right': '15px',
        'font-weight': 'bold'
    });

    $('.demo-icons').css({
        'display': 'flex',
        'align-items': 'center'
    });

    $('.demo-icons a').css({
        'color': '#ffffff',
        'font-size': '18px',
        'text-decoration': 'none'
    });

    $('#github-icon').css({
        'margin-right': '10px'
    });

    // 读取配置
    function loadConfig() {
        return $.ajax({
            url: 'config.json',
            type: 'GET',
            dataType: 'json',
            cache: false // 禁用缓存
        })
            .then(function (data) {
                if (data.demoMode === true) {
                    console.log('演示模式：合并localStorage配置');
                    data = mergeDemoConfig(data);
                } else {
                    console.log('非演示模式：仅使用config.json配置');
                    localStorage.removeItem(DEMO_STORAGE_KEY);
                }
                return data;
            })
            .catch(function (xhr, status, error) {
                console.error('读取config.json时出错:', status, error || xhr.statusText);
                $('.tips').text('读取配置文件失败: ' + (error || xhr.statusText));
                throw error || status;
            });
    }

    // 处理配置数据
    function processConfig(data) {
        activeConfig = data;

        // 设置网站标题
        if (data.blessText && data.blessText.websiteTitle) {
            $('#website-title').text(data.blessText.websiteTitle);
        }

        enforceRouteForIndex(data.birthdayTime);

        // 设置倒计时姓名
        if (data.name) {
            $('#countdown-name').text(data.name);
        }

        // 设置首页文案
        if (data.homepageText1) {
            $('#homepage-text1').text(convertToItalicLetters(data.homepageText1));
        }
        if (data.homepageText2) {
            $('#homepage-text2').text(convertToItalicLetters(data.homepageText2));
        }

        // 检查是否为演示模式
        if (data.demoMode === true) {
            // 确保DOM元素存在
            if ($('#demo-mode-container').length === 0) {
                console.error('找不到演示模式容器元素');
                return;
            }

            // 显示演示模式水印和图标
            $('#demo-mode-container').show();

            // 强制设置样式，确保水印可见
            $('#demo-mode-container').css({
                'display': 'flex',
                'position': 'fixed',
                'top': '20px',
                'right': '20px',
                'z-index': '1000',
                'background-color': 'rgba(0, 0, 0, 0.5)',
                'padding': '8px 15px',
                'border-radius': '20px'
            });

            // 确保文本和图标样式正确
            $('.demo-mode-text').css({
                'color': '#ffffff',
                'font-size': '14px',
                'margin-right': '15px',
                'font-weight': 'bold'
            });

            $('.demo-icons').css({
                'display': 'flex',
                'align-items': 'center'
            });

            $('.demo-icons a').css({
                'color': '#ffffff',
                'font-size': '18px',
                'text-decoration': 'none'
            });

            $('#github-icon').css({
                'margin-right': '10px'
            });

            // 设置GitHub链接
            $('#github-icon').attr('href', data.githubUrl);

            // 设置设置图标的点击事件
            $('#settings-icon')
                .off('click')
                .on('click', function (e) {
                    e.preventDefault();
                    showSettingsModal();
                });

            runTime(data.birthdayTime);
        } else {
            // 非演示模式，隐藏演示模式水印和图标
            $('#demo-mode-container').hide();

            // 检查生日时间
            runTime(data.birthdayTime);
        }

        $('.tips').text(data.birthdayTime); // 显示日期提示
        console.log('设置生日时间提示:', data.birthdayTime);
    }

    loadConfig()
        .then(function (configData) {
            processConfig(configData);
        })
        .catch(function () {
            console.warn('无法加载配置，倒计时暂停');
        });

    // 显示设置弹窗
    function showSettingsModal() {
        // 获取当前配置
        var currentConfig = localStorage.getItem(DEMO_STORAGE_KEY);
        if (currentConfig) {
            createSettingsModal(JSON.parse(currentConfig));
            return;
        }

        if (activeConfig) {
            createSettingsModal(buildEditableSnapshot(activeConfig));
            return;
        }

        $.ajax({
            url: 'config.json',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (data) {
                createSettingsModal(buildEditableSnapshot(data));
            },
            error: function (xhr, status, error) {
                console.error('读取config.json失败:', error);
            }
        });
    }

    // 创建设置弹窗
    function createSettingsModal(config) {
        // 转换日期时间格式为datetime-local兼容格式
        function formatDateTimeForInput(dateStr) {
            if (!dateStr) return '';
            // 将 "YYYY-MM-DD HH:MM:SS" 格式转换为 "YYYY-MM-DDTHH:MM" 格式
            return dateStr.replace(' ', 'T').substring(0, 16);
        }

        function escapeHtml(str) {
            if (str === undefined || str === null) {
                return '';
            }
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        // 如果弹窗已存在，先移除
        if ($('#settings-modal').length > 0) {
            $('#settings-modal').remove();
        }

        var blessText = config.blessText || {};

        // 创建弹窗HTML
        var modalHtml = `
            <div id="settings-modal" class="settings-modal">
                <div class="settings-backdrop"></div>
                <div class="settings-container">
                    <div class="settings-header">
                        <h2 class="settings-title">配置设置</h2>
                        <button class="settings-close" id="close-settings">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <div class="settings-content">
                        <form id="settings-form" class="settings-form">
                            <div class="settings-section">
                                <h3 class="section-title">基本信息</h3>
                                <div class="form-group">
                                    <label for="config-name" class="form-label">姓名</label>
                                    <input type="text" id="config-name" class="form-input" value="${config.name}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-birthdayTime" class="form-label">生日时间</label>
                                    <input type="datetime-local" id="config-birthdayTime" class="form-input" value="${formatDateTimeForInput(config.birthdayTime)}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-websiteTitle" class="form-label">网站标题</label>
                                    <input type="text" id="config-websiteTitle" class="form-input" value="${escapeHtml(blessText.websiteTitle || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-homepageText1" class="form-label">首页文案 1</label>
                                    <input type="text" id="config-homepageText1" class="form-input" value="${escapeHtml(config.homepageText1 || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-homepageText2" class="form-label">首页文案 2</label>
                                    <input type="text" id="config-homepageText2" class="form-input" value="${escapeHtml(config.homepageText2 || '')}" required>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h3 class="section-title">祝贺页</h3>
                                <div class="form-group">
                                    <label for="config-text1" class="form-label">文本 1</label>
                                    <input type="text" id="config-text1" class="form-input" value="${escapeHtml(blessText.text1 || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-text2" class="form-label">文本 2</label>
                                    <input type="text" id="config-text2" class="form-input" value="${escapeHtml(blessText.text2 || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-text3" class="form-label">文本 3</label>
                                    <input type="text" id="config-text3" class="form-input" value="${escapeHtml(blessText.text3 || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-text4" class="form-label">文本 4</label>
                                    <input type="text" id="config-text4" class="form-input" value="${escapeHtml(blessText.text4 || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-text5" class="form-label">文本 5</label>
                                    <input type="text" id="config-text5" class="form-input" value="${escapeHtml(blessText.text5 || '')}" required>
                                </div>
                            </div>

                            <div class="settings-section">
                                <div class="form-group">
                                    <label for="config-text6" class="form-label">文本 6</label>
                                    <input type="text" id="config-text6" class="form-input" value="${escapeHtml(blessText.text6 || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-text7" class="form-label">文本 7</label>
                                    <input type="text" id="config-text7" class="form-input" value="${escapeHtml(blessText.text7 || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-text8" class="form-label">文本 8</label>
                                    <input type="text" id="config-text8" class="form-input" value="${escapeHtml(blessText.text8 || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-text9" class="form-label">文本 9</label>
                                    <input type="text" id="config-text9" class="form-input" value="${escapeHtml(blessText.text9 || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-text10" class="form-label">文本 10</label>
                                    <input type="text" id="config-text10" class="form-input" value="${escapeHtml(blessText.text10 || '')}" required>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h3 class="section-title">祝福</h3>
                                <div class="form-group">
                                    <label for="config-wishHead" class="form-label">祝福标题</label>
                                    <input type="text" id="config-wishHead" class="form-input" value="${escapeHtml(blessText.wishHead || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="config-wishText" class="form-label">祝福内容</label>
                                    <input type="text" id="config-wishText" class="form-input" value="${escapeHtml(blessText.wishText || '')}" required>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h3 class="section-title">礼物设置</h3>
                                <div class="form-group">
                                    <label for="config-ifHaveGift" class="form-label">是否有礼物</label>
                                    <div class="form-select">
                                        <select id="config-ifHaveGift" class="select-input">
                                            <option value="true" ${config.ifHaveGift ? 'selected' : ''}>是</option>
                                            <option value="false" ${!config.ifHaveGift ? 'selected' : ''}>否</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group gift-extra-field">
                                    <label for="config-giftText" class="form-label">礼物文本</label>
                                    <input type="text" id="config-giftText" class="form-input" value="${escapeHtml(blessText.giftText || '')}" required>
                                </div>
                                <div class="form-group gift-extra-field">
                                    <label for="config-giftButtonText" class="form-label">礼物按钮文本</label>
                                    <input type="text" id="config-giftButtonText" class="form-input" value="${escapeHtml(blessText.giftButtonText || '')}" required>
                                </div>
                            </div>
                            
                            <div class="settings-actions">
                                <button type="button" id="reset-settings" class="btn btn-reset">
                                    <span class="btn-icon">↺</span>
                                    重置
                                </button>
                                <div class="btn-group">
                                    <button type="button" id="cancel-settings" class="btn btn-cancel">取消</button>
                                    <button type="submit" class="btn btn-primary">
                                        <span class="btn-icon">✓</span>
                                        保存
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // 添加弹窗到页面
        $('body').append(modalHtml);

        // 添加CSS样式
        if (!$('#settings-modal-styles').length) {
            $('head').append(`
                <style id="settings-modal-styles">
                    .settings-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 2000;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 0.3s ease, visibility 0.3s ease;
                    }

                    .settings-modal.show {
                        opacity: 1;
                        visibility: visible;
                    }

                    .settings-backdrop {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(8px);
                    }

                    .settings-container {
                        position: relative;
                        background: linear-gradient(135deg, #fff9fd 0%, #fdf2ff 100%);
                        border-radius: 24px;
                        box-shadow: 0 30px 60px -20px rgba(150, 50, 150, 0.2),
                                    0 10px 30px -10px rgba(200, 100, 200, 0.15),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.8);
                        width: 90%;
                        max-width: 620px;
                        max-height: 85vh;
                        overflow: hidden;
                        transform: translateY(30px) scale(0.97);
                        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
                        display: flex;
                        flex-direction: column;
                        border: 1px solid rgba(255, 255, 255, 0.9);
                    }

                    .settings-modal.show .settings-container {
                        transform: translateY(0) scale(1);
                    }

                    .settings-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 28px 32px 20px;
                        border-bottom: 1px solid rgba(255, 182, 193, 0.2);
                        background: linear-gradient(to right, rgba(255, 240, 245, 0.9), rgba(255, 248, 252, 0.9));
                        position: relative;
                    }

                    .settings-header::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 4px;
                        background: linear-gradient(to right, #ff9ec0, #c77dff, #ff9ec0);
                        border-radius: 2px;
                    }

                    .settings-title {
                        margin: 0;
                        font-size: 26px;
                        font-weight: 700;
                        background: linear-gradient(135deg, #e91e63, #9c27b0);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        letter-spacing: -0.02em;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .settings-title::before {
                        content: '🎁';
                        font-size: 24px;
                        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                    }

                    .settings-close {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.9);
                        border: 1px solid rgba(255, 182, 193, 0.3);
                        color: #e91e63;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(233, 30, 99, 0.1);
                    }

                    .settings-close:hover {
                        background: #fff;
                        transform: rotate(90deg);
                        box-shadow: 0 6px 16px rgba(233, 30, 99, 0.2);
                        color: #9c27b0;
                    }

                    .settings-content {
                        padding: 0;
                        overflow-y: auto;
                        flex: 1;
                        background: rgba(255, 255, 255, 0.5);
                    }

                    .settings-form {
                        padding: 24px 32px 32px;
                    }

                    .settings-section {
                        margin-bottom: 36px;
                        padding: 24px;
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 8px 24px rgba(150, 50, 150, 0.05);
                        border: 1px solid rgba(255, 182, 193, 0.15);
                        position: relative;
                        overflow: hidden;
                    }

                    .settings-section::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 6px;
                        height: 100%;
                        background: linear-gradient(to bottom, #ff9ec0, #c77dff);
                        border-radius: 3px 0 0 3px;
                    }

                    .section-title {
                        font-size: 20px;
                        font-weight: 700;
                        color: #7b1fa2;
                        margin: 0 0 20px 0;
                        padding-bottom: 12px;
                        border-bottom: 2px solid rgba(255, 182, 193, 0.3);
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .section-title::before {
                        content: '✨';
                        font-size: 18px;
                    }

                    .form-group {
                        margin-bottom: 24px;
                        position: relative;
                    }

                    .form-label {
                        display: block;
                        font-size: 15px;
                        font-weight: 600;
                        color: #5d4037;
                        margin-bottom: 10px;
                        padding-left: 8px;
                        border-left: 3px solid #ff9ec0;
                    }

                    .form-input, .form-textarea {
                        width: 100%;
                        padding: 14px 18px;
                        border: 2px solid #f0e6f5;
                        border-radius: 12px;
                        font-size: 15px;
                        transition: all 0.3s ease;
                        background-color: #fefaff;
                        color: #4a148c;
                        font-family: inherit;
                        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.03);
                    }

                    .form-input:focus, .form-textarea:focus {
                        outline: none;
                        border-color: #e91e63;
                        background-color: #fff;
                        box-shadow: 0 0 0 4px rgba(233, 30, 99, 0.1),
                                    inset 0 2px 6px rgba(0, 0, 0, 0.03);
                        transform: translateY(-2px);
                    }

                    .form-input::placeholder, .form-textarea::placeholder {
                        color: #b39ddb;
                        opacity: 0.7;
                    }

                    .form-textarea {
                        min-height: 100px;
                        resize: vertical;
                        line-height: 1.6;
                    }

                    .form-select {
                        position: relative;
                    }

                    .select-input {
                        width: 100%;
                        padding: 14px 18px;
                        border: 2px solid #f0e6f5;
                        border-radius: 12px;
                        font-size: 15px;
                        background-color: #fefaff;
                        color: #4a148c;
                        cursor: pointer;
                        appearance: none;
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23e91e63'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e");
                        background-position: right 16px center;
                        background-repeat: no-repeat;
                        background-size: 18px;
                        padding-right: 48px;
                        transition: all 0.3s ease;
                        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.03);
                    }

                    .select-input:focus {
                        outline: none;
                        border-color: #e91e63;
                        background-color: #fff;
                        box-shadow: 0 0 0 4px rgba(233, 30, 99, 0.1);
                        transform: translateY(-2px);
                    }

                    .settings-actions {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 40px;
                        padding-top: 24px;
                        border-top: 2px dashed rgba(255, 182, 193, 0.4);
                    }

                    .btn-group {
                        display: flex;
                        gap: 16px;
                    }

                    .btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        padding: 14px 24px;
                        border-radius: 14px;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1);
                        border: none;
                        position: relative;
                        overflow: hidden;
                    }

                    .btn::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                        transition: left 0.6s;
                    }

                    .btn:hover::before {
                        left: 100%;
                    }

                    .btn-icon {
                        font-size: 18px;
                        filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
                    }

                    .btn-reset {
                        background: linear-gradient(135deg, #fff5f7, #ffeef1);
                        color: #d32f2f;
                        border: 2px solid #ffcdd2;
                        box-shadow: 0 6px 16px rgba(211, 47, 47, 0.1);
                    }

                    .btn-reset:hover {
                        background: linear-gradient(135deg, #ffeef1, #ffe5e9);
                        transform: translateY(-3px) scale(1.05);
                        box-shadow: 0 10px 24px rgba(211, 47, 47, 0.2);
                        color: #b71c1c;
                    }

                    .btn-cancel {
                        background: linear-gradient(135deg, #f8f9ff, #f3f4ff);
                        color: #5d4037;
                        border: 2px solid #e1bee7;
                        box-shadow: 0 6px 16px rgba(93, 64, 55, 0.1);
                    }

                    .btn-cancel:hover {
                        background: linear-gradient(135deg, #f3f4ff, #e8eaff);
                        transform: translateY(-3px) scale(1.05);
                        box-shadow: 0 10px 24px rgba(93, 64, 55, 0.2);
                        color: #3e2723;
                    }

                    .btn-primary {
                        background: linear-gradient(135deg, #ff4081, #e91e63, #9c27b0);
                        color: white;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        box-shadow: 0 8px 24px rgba(233, 30, 99, 0.3);
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    }

                    .btn-primary:hover {
                        background: linear-gradient(135deg, #f50057, #d81b60, #7b1fa2);
                        transform: translateY(-3px) scale(1.05);
                        box-shadow: 0 12px 32px rgba(233, 30, 99, 0.4);
                    }

                    @media (max-width: 640px) {
                        .settings-container {
                            width: 95%;
                            max-height: 90vh;
                            border-radius: 20px;
                        }

                        .settings-header {
                            padding: 20px 24px 16px;
                        }

                        .settings-title {
                            font-size: 22px;
                        }

                        .settings-form {
                            padding: 20px 24px 28px;
                        }

                        .settings-section {
                            padding: 20px;
                            margin-bottom: 28px;
                        }

                        .section-title {
                            font-size: 18px;
                        }

                        .settings-actions {
                            flex-direction: column;
                            gap: 16px;
                        }

                        .btn-group {
                            width: 100%;
                            flex-direction: column;
                        }

                        .btn {
                            width: 100%;
                            justify-content: center;
                        }

                        .btn-reset {
                            order: 3;
                            margin-top: 16px;
                        }
                    }
                </style>
            `);
        }

        // 显示弹窗（带动画）
        setTimeout(function () {
            $('#settings-modal').addClass('show');
        }, 10);

        // 绑定关闭按钮事件
        $('#close-settings, #cancel-settings').on('click', function () {
            closeModal();
        });

        // 点击背景关闭弹窗
        $('.settings-backdrop').on('click', function () {
            closeModal();
        });

        // 绑定重置按钮事件
        $('#reset-settings').on('click', function () {
            localStorage.removeItem(DEMO_STORAGE_KEY);
            closeModal();
            setTimeout(function () {
                location.reload(); // 重新加载页面以使用默认配置
            }, 300);
        });

        function updateGiftFieldsVisibility() {
            var hasGift = $('#config-ifHaveGift').val() === 'true';
            $('.gift-extra-field').toggle(hasGift).find('input').prop('required', hasGift);
        }

        $('#config-ifHaveGift').on('change', updateGiftFieldsVisibility);
        updateGiftFieldsVisibility();

        // 绑定表单提交事件
        $('#settings-form').on('submit', function (e) {
            e.preventDefault();

            // 转换日期时间格式为原始格式
            function formatDateTimeForStorage(dateStr) {
                if (!dateStr) return '';
                // 将 "YYYY-MM-DDTHH:MM" 格式转换为 "YYYY-MM-DD HH:MM:SS" 格式
                return dateStr.replace('T', ' ') + ':00';
            }

            // 获取表单数据，只保存允许用户修改的字段
            var formData = {
                name: $('#config-name').val(),
                birthdayTime: formatDateTimeForStorage($('#config-birthdayTime').val()),
                ifHaveGift: $('#config-ifHaveGift').val() === 'true',
                homepageText1: $('#config-homepageText1').val(),
                homepageText2: $('#config-homepageText2').val(),
                blessText: {
                    websiteTitle: $('#config-websiteTitle').val(),
                    text1: $('#config-text1').val(),
                    text2: $('#config-text2').val(),
                    text3: $('#config-text3').val(),
                    text4: $('#config-text4').val(),
                    text5: $('#config-text5').val(),
                    text6: $('#config-text6').val(),
                    text7: $('#config-text7').val(),
                    text8: $('#config-text8').val(),
                    text9: $('#config-text9').val(),
                    text10: $('#config-text10').val(),
                    wishHead: $('#config-wishHead').val(),
                    wishText: $('#config-wishText').val(),
                    giftText: $('#config-giftText').val(),
                    giftButtonText: $('#config-giftButtonText').val()
                }
                // 注意：不保存demoMode、userImagePath、giftImagePath、githubUrl等字段
                // 这些字段只能从config.json读取，用户不能修改
            };

            // 保存到localStorage
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(formData));

            // 关闭弹窗
            closeModal();

            // 重新加载页面以应用新配置
            setTimeout(function () {
                location.reload();
            }, 300);
        });

        // 关闭弹窗函数
        function closeModal() {
            $('#settings-modal').removeClass('show');
            setTimeout(function () {
                $('#settings-modal').remove();
            }, 300);
        }
    }

    function enforceRouteForIndex(time) {
        var targetDate = parseDateString(time);
        if (!targetDate) {
            console.warn('无效的生日时间配置，无法执行页面路由判断');
            return;
        }
        var diff = targetDate.getTime() - Date.now();
        if (diff <= 0) {
            markRedirectTarget('index3');
            window.location.href = 'index3.html';
        } else if (diff <= 10000) {
            markRedirectTarget('index2');
            window.location.href = 'index2.html';
        }
    }

    // 时间计算
    function endTime(endDate) {
        var leftTime = new Date(endDate) - new Date(); //计算剩余的毫秒数
        if (leftTime <= 0) {
            window.location.href = 'index3.html';
        } else if (leftTime <= 10000) {
            window.location.href = 'index2.html';
        }

        var days = parseInt(leftTime / 1000 / 60 / 60 / 24, 10); //计算剩余的天数
        var hours = parseInt((leftTime / 1000 / 60 / 60) % 24, 10); //计算剩余的小时
        var minutes = parseInt((leftTime / 1000 / 60) % 60, 10); //计算剩余的分钟
        var seconds = parseInt((leftTime / 1000) % 60, 10); //计算剩余的秒数
        days = checkTime(days);
        hours = checkTime(hours);
        minutes = checkTime(minutes);
        seconds = checkTime(seconds);
        if (days >= 0 || hours >= 0 || minutes >= 0 || seconds >= 0) {
            $('p.day').text(days);
            $('p.hour').text(hours);
            $('p.min').text(minutes);
            $('p.sec').text(seconds);
        }
    }

    function checkTime(i) {
        //将0-9的数字前面加上0，例1变为01
        if (i < 10) {
            i = '0' + i;
        }
        return i;
    }

    // 刷新时间
    function runTime(time) {
        var futureDate = new Date(time);

        if (new Date(time) - new Date() <= 0) {
            markRedirectTarget('index3');
            window.location.href = 'index3.html';
        }

        order_time = setInterval(function () {
            endTime(futureDate);
        }, 1000);
    }
});
