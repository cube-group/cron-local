/**
 * Created by linyang on 2018/3/27.
 * 任务机应用程序.
 */
let Schedule = require('./schedule');

/**
 * 正在执行任务的schedule列表.
 */
let tasks = [];

/**
 * 创建单任务
 * @param data
 */
function newTask(data) {
    if (data) {
        console.log('[Create Task]', data.time, data.value);
        tasks.push(new Schedule(data));
    }
}

/**
 * 关闭
 */
exports.stop = () => {
    for (let key in tasks) {
        tasks[key].stop();
        delete tasks[key];
    }
    tasks = null;
};

/**
 * 启动
 */
exports.start = (results) => {
    tasks = [];
    let count = 0;
    console.log('task-total Number', results.length);
    for (let i = 0; i < results.length; i++) {
        newTask(results[i]);
        count++;
    }
};