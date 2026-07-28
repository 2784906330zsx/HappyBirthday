# HappyBirthday

A romantic birthday greeting website. Give your loved one a creative, surprising, and impressive birthday gift. Online demo: <https://happybirthday.zsxfun.fun>

## Important Statement

This project was integrated and developed based on several open-source projects (listed in no particular order):

- <https://github.com/faahim/happy-birthday> (Original)
- <https://github.com/abandon888/HappyBirthday> (Secondary creation; this project is effectively a tertiary creation)
- <https://gitee.com/baobao_JK/CountDown-2023> (Colorful background + target countdown)
- <https://github.com/Junrui-L/Happy-birthDay> (Second countdown)
- <https://github.com/fox493/-button-css-> (Glowing buttons)

## Improvements in this Project (Mainly compared to [abandon888](https://github.com/abandon888/HappyBirthday)'s version)

- Removed Nodejs environment; requires almost no environment configuration.
- Added a countdown to better create a sense of mystery and surprise.
- Blessing text is customizable without needing to modify the code.
- Added gift display, supporting the showcase of gift images.
- Added a demo mode feature, supporting online deployment for public access while retaining local customization capabilities.

## Local Running Tutorial
### Preparation

- Install any version of Python.
- Clone the project to your local machine.
- Change the `demoMode` field in `config.json` to `false` and fill in other blessing information.

### Execution Steps

- Open a terminal in the project root directory and run `python -m http.server`.
- Open `http://localhost:8000` in your browser.

## Notes

- Before running the project, make sure to set the birthday date to a date after today. There are a total of three pages; if the birthday date has passed, it will default to the third page, and you will be unable to return to the first two pages.
