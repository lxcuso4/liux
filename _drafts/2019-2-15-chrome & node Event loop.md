---
layout:
title: chrome & node Event loop
categories: algorithm
description: event loop。
keywords:node event loop macro micro
---

#### 宏任务微任务在chorme和node环境下的差异

先看一段代码

```
console.log('start')

setTimeout(function() {
    console.log(1)
},0)
new Promise(function(resolve) {
    resolve()
    console.log(2)
}).then(()=>{
    console.log(3)
}).then(()=>{
    console.log(4)
})
Promise.resolve().then(()=>{
    console.log(5)
})

console.log('end')
```
> 正确的输出值是什么

输出：start 2 end 3 5 4 1

### chrome中分析

#### 第一次执行
+ 执行栈，先执行同步代码
  - console.log('start') // 打印 start
  - setTimeOut // 将function推给定时触发器线程，延时到期后定时器将函数推到macrotask
  - new Promise(function(){
    resolve()
    console.log(2)
}) // 执行new Promise resolve()将then函数推到microtask，打印2
  - Promise.resolve()// 将 console.log(5)函数推到microtask
  - console.log('end') // 打印end

##### 第一次执行完成，结果
```
输出：start、 2、 end
microtask：()=>{ console.log(3)}，()=>{
    console.log(5)
}
macrotask:  console.log(1)
```

#### 第二次执行
+ 同步代码执行完成，查看microtask队列不为空
  - 将()=>{ console.log(3)}取到执行栈执行
  - 打印 3， 触发then函数链式调用将()=>{
    console.log(4)}推入microtask队列

##### 第二次执行完成，结果

```
输出：start、 2、 end、3
microtask：()=>{console.log(5)}、()=>{console.log(4)}
macrotask:  console.log(1)
```
#### 第三次执行

+ 继续查看microtask 不为空
  - 将()=>{console.log(5)}拉入执行栈执行，打印5

##### 第三次执行完成，结果

```
输出：start、 2、 end、3、5
microtask：()=>{console.log(4)}
macrotask:  console.log(1)
```
#### 第四次执行

+ 继续查看microtask 不为空
  - 将()=>{console.log(4)}拉入执行栈执行，打印4

```
输出：start、 2、 end、3、5、4
microtask：空
macrotask:  console.log(1)
```

#### 第五次执行

+ 继续查看microtask为空，查看macrotask 不为空
  - 将console.log(1) 拉入执行栈执行，打印1

```
输出：start、 2、 end、3、5、4、1
microtask：空
macrotask:  空
```
到此所有异步队列被清空

#### 结论

+ Promise funtion 在第一次执行栈中被执行
+ 在当promise fulfilled 或者rejected 后 then 函数立即被推到microtask
+ 每次循环结束先查看microtask队列， 清空后才执行macrotask队列
+ 每执行一个macro，清空microtask，与node不同

### node 中分析

> node中的

```
 */
const log = console.log.bind(console);
const fs = require('fs')



process.nextTick(function(){
    log(3);
    process.nextTick(function () {
        log(31)
    })
    Promise.resolve().then(function () {
        log(32)
    })
    setTimeout(function () {
        log(33)
    })
    fs.readFile('./a.js', () => {
        log(34)
    })
    setImmediate(function(){
        log(35);
    });
});
fs.readFile('./a.js', () => {
    log(4)
    // process.nextTick(function () {
    //     log(41)
    // })
    Promise.resolve().then(function () {
        log(42)
    })
    setTimeout(function () {
        log(43)
    })
    fs.readFile('./a.js', () => {
        log(44)
    })
    setImmediate(function(){
        log(45);
    });

})

Promise.resolve().then(function () {
    log(5)
    process.nextTick(function () {
        log(51)
    })
    Promise.resolve().then(function () {
        log(52)
    })
    setTimeout(function () {
        log(53) // 放入队列需要成本，这个不依赖，setTimeout 最小延迟4ms 可能达到10ms，因此，此函数能否在下一次timer回合中放入宏事件队列，不确定，意味着可能在21、22之前或者之后执行
    })
    fs.readFile('./a.js', () => {
        log(54)
    })
    setImmediate(function(){
        log(55);
    });
})
setImmediate(function(){
    log(1);
    process.nextTick(function () {
        log(11)
    })
    Promise.resolve().then(function () {
        log(12)
    })
    setTimeout(function () {
        log(13)
    })
    fs.readFile('./a.js', () => {
        log(14)
    })
    setImmediate(function(){
        log(15);
    });
});
setTimeout(function () {
    log(2)
    process.nextTick(function () {
        log(21)
    })
    Promise.resolve().then(function () {
        log(22)
    })
    setTimeout(function () {
        log(23)
    })
    fs.readFile('./a.js', () => {
        log(24)
    })
    setImmediate(function(){
        log(25);
    });
})

log('start')

// start
3 31
5 32 52 51
2 33 21 22
4 42 34 54 24
1 35 55 25 45 11 12
53 23 44 14 15
43 13

```

![image]({{site.baseurl}}/assets/img/node事件机制.jpg)

#### Node的Event loop一共分为6个阶段，每个阶段执行的函数细节如下：

+ timers: 执行setTimeout和setInterval中到期的callback。
+ pending callback: 上一轮循环中少数的callback会放在这一阶段执行。
+ idle, prepare: 仅在内部使用。
+ poll: 最重要的阶段，执行pending callback，在适当的情况下回阻塞在这个阶段。
+ check: 执行setImmediate(setImmediate()是将事件插入到事件队列尾部，主线程和事件队列的函数执行完成之后立即执行setImmediate指定的回调函数)的callback。
+ close callbacks: 执行close事件的callback，例如socket.on('close'[,fn])或者http.server.on('close, fn)。


+ main 程序先执行
+ 每次循环分为6个阶段，每个阶段完成后执行额外回合，nextTick micro
+ 额外回合完成后继续执行额外回合，无额外回合则执行下一个阶段
+ setTimeout 由计时器线程在计时结束后放入 macro task 这个过程本身需要耗时，最少4ms
+ setTimeout， fs 回调放入macro 的时机是不确定的，如果本回合执行到当前阶段，但是计时器线程或者fs回调还没有将callback放入macro 则需要等到下回合再执行
+ poll队列为空
  - 如果有setImmediate()回调需要执行，则会立即停止执行poll阶段并进入执行check阶段以执行回调
  - 如果没有setImmediate()回到需要执行，poll阶段将等待callback被添加到队列中，然后立即执行
+

> 参考
[《一次弄懂Event Loop》](https://juejin.im/post/5c3d8956e51d4511dc72c200)
[《Node.js事件循环，定时器和 》](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
[《Design overview》](http://docs.libuv.org/en/v1.x/design.html)

