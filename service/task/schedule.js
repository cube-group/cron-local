/**
 * Created by linyang on 17/3/3.
 * 核心任务单元
 */
let nodeCron = require('node-cron');
let exec = require('./exec');
let curl = require('../../libs/curl');
let config = require('../../conf/config');

/**
 * 任务主体.
 * @param data {array}
 * @returns {*}
 * @constructor
 */
function MySchedule(data) {
    if (!data || !data.time || !data.value) {
        return null;
    }

    //scheduler
    let job = null;
    //执行实例.
    let execInstance = null;
    //当前执行的错误次数.
    let errorCount = 0;
    //当前执行的成功次数.
    let successCount = 0;
    //最近一次执行失败的错误内容.
    let lastError = '';
    //上次执行开始的时间戳(单位:毫秒)
    let lastTime = 0;
    //最近一次执行耗时(单位:毫秒)
    let lastUseTime = 0;
    //平均执行耗时(单位:毫秒)
    let averageUseTime = 0;


    /**
     * 发送邮件检测.
     * @param err
     */
    function sendMail(err) {
        lastError = '[' + (errorCount + successCount) + '] ' + err;
        if (config.webhook) {
            let content = `[cron-engine error] engine:${config.name}  time:${data.time}  value:${data.value}`;
            let contentBody = {'msgtype': 'text', 'text': {'content': content}, 'at': {'isAtAll': true}};
            let options = {
                url: config.webhook,
                method: 'POST',
                headers: {'Content-Type': 'application/json'},//headers array
                body: JSON.stringify(contentBody),//method为post时的body
                timeout: 2000,//超时时间(单位:秒),<=0时不计算超时
            };
            curl.send(options, function (err) {
                console.log(err ? err.message : null);
            });
        }
    }


    /**
     * 检测发送状态.
     * @param flag
     */
    function executeStatus(flag) {
        if (flag) {
            lastTime = new Date().getTime();
        } else {
            execInstance.close();
            execInstance = null;

            lastUseTime = new Date().getTime() - lastTime;
            if (averageUseTime) {
                averageUseTime = parseInt((averageUseTime + lastUseTime) >> 1);
            } else {
                averageUseTime = lastUseTime;
            }
        }
    }

    //启动
    function scheduleExec() {

        if (!execInstance) {
            executeStatus(true);
            execInstance = new exec.Shell();
            execInstance.exec(data.value, function (err, result) {
                executeStatus(false);
                console.log(data.value);
                if (err) {
                    errorCount++;
                    sendMail(result);
                } else {
                    successCount++;
                }
            });
        }
    }

    /**
     * 停止cron
     */
    this.stop = function () {
        //立即停止schedule
        if (job) {
            job.destroy();
            job = null;
        }
        //立即停止执行实例
        if (execInstance) {
            execInstance.close();
            execInstance = null;
        }
    };


    /**
     * 执行失败次数
     * @returns {number}
     */
    this.getErrorCount = function () {
        return errorCount;
    };

    /**
     * 执行成功的次数.
     * @returns {number}
     */
    this.getSuccessCount = function () {
        return successCount;
    };

    /**
     * 获取执行的cron时间
     * @returns {*}
     */
    this.getExecTime = function () {
        return data.time;
    };

    /**
     * 获取执行的cron内容.
     * @returns {*}
     */
    this.getExecValue = function () {
        return data.value;
    };

    /**
     * 获取当前任务体信息.
     * @returns {{errorCount: number, successCount: number, time: *, value: *}}
     */
    this.getInfo = function () {
        return {
            comment: data.comment,
            type: data.type,
            mail: data.mail,
            errorCount: this.getErrorCount(),
            successCount: this.getSuccessCount(),
            status: this.getSuccessCount() + '/' + (this.getErrorCount() + this.getSuccessCount()),
            time: this.getExecTime(),
            value: this.getExecValue(),
            error: lastError,
            useTime: lastUseTime + 'ms',
            averageTime: averageUseTime + 'ms'
        };
    };

    //启动schedule
    //同时只允许有一个shell或http命令在执行.
    try {
        job = nodeCron.schedule(data.time, scheduleExec, true);
    } catch (e) {
        trace.error(`[schedule error] ${e.message}`);
        this.stop();
    }
}

module.exports = MySchedule;