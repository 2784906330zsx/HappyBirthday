# HappyBirthday

专属程序员的浪漫生日祝福，适合程序员或者计算机专业的学生给情侣、夫妻、暗恋的TA送上一份印象深刻的生日礼物
演示网站：https://zjw-birthday.zsxfun.fun

### 重要声明

此项目是基于以下若干开源项目整合开发的，本人感谢并致敬原作者，尊重版权意识和开源精神，因此将用到的所有原链接列出（排名不分先后）
* https://github.com/faahim/happy-birthday (原创)
* https://github.com/abandon888/HappyBirthday (二创，本人相当于三创)
* https://www.bilibili.com/video/BV1Tb411d7ru (炫彩背景+目标倒计时)
* https://github.com/Junrui-L/Happy-birthDay (读秒倒计时)
* https://github.com/fox493/-button-css- (流光按钮)


### 本项目的改进点（主要对比abandon888的版本）

* 舍弃了Nodejs环境，不需要额外下包，避免了众所周知的因为网络问题导致的一些不方便的情况
* 加入了倒计时，更容易营造神秘感和惊喜感
* 文案自定义更自由，在倒计时进行时就可以展示自定义文案
* 生日日期可在date.json中快捷修改，无需修改代码
* 加入了礼物环节，支持添加其他url，可一键跳转到展示礼物信息的界面（例如可自定义重定向到快递物流查询网站，图文信息、视频）。从此爱意不仅仅是略显尴尬的网页

### 本地运行步骤

* 安装任意版本的Python
* 在项目根目录打开终端，运行python -m http.server
* 用浏览器打开localhost:8000即可

### 注意事项

* date.json中是生日日期，为了看到完整的效果，运行前最好把日期改到当前日期之后，因为一共有三个页面，如果过期了则默认打开第三个页面且无法打开前两个页面。
