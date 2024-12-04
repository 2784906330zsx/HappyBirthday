$(function () {
    var order_time = null;

    // 获取日期数据
    fetch('config.json')
        .then((response) => response.json())
        .then((data) => {
            runTime(data.date);
            $('.tips').text(data.date); // 显示日期提示
        });

    // 时间计算
    function endTime(endDate) {
        var leftTime = new Date(endDate) - new Date(); //计算剩余的毫秒数
        if (leftTime <= 0) {
            window.location.href = '../index3.html';
        } else if (leftTime <= 10000) {
            window.location.href = '../index2.html';
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
            window.location.href = '../index3.html';
        }

        order_time = setInterval(function () {
            endTime(futureDate);
        }, 1000);
    }
});
