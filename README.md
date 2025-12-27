# HappyBirthday

浪漫生日祝福网站，快给TA送上一份富含创意、惊喜、印象深刻的生日礼物吧。

## 重要声明

此项目是基于以下若干开源项目整合开发的（排名不分先后）

- <https://github.com/faahim/happy-birthday> (原创)
- <https://github.com/abandon888/HappyBirthday> (二创，本人相当于三创)
- <https://gitee.com/baobao_JK/CountDown-2023> (炫彩背景+目标倒计时)
- <https://github.com/Junrui-L/Happy-birthDay> (读秒倒计时)
- <https://github.com/fox493/-button-css-> (流光按钮)

## 本项目的改进点（主要对比[abandon888](https://github.com/abandon888/HappyBirthday)的版本）

- 移除了Nodejs环境，几乎不需要任何环境配置
- 加入了倒计时，更容易营造神秘感和惊喜感
- 祝福文案可自定义，无需修改代码
- 新增了礼物显示，支持展示礼物图片
- 新增演示模式功能，支持网站在线部署供所有人访问，同时保留本地自定义功能

## 本地运行教程
### 准备工作

- 安装任意版本的Python
- clone项目到本地
- 修改`config.json`中的`demoMode`字段为`false`，填写其他祝福信息

### 运行步骤

- 在项目根目录打开终端，运行`python -m http.server`
- 在浏览器打开`http://localhost:8000`

## 注意事项

- 运行项目之前，需要把生日日期改到当前日期之后，因为一共有三个页面，如果过了生日日期则默认打开第三个页面，且无法回到前两个页面。
