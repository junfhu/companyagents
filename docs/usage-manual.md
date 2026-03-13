# 功能使用手册

English version: `usage-manual_EN.md`

## 适合谁看

这份文档适合已经把系统跑起来、接下来想知道“应该怎么用”的人。

## 产品核心流程

这套系统围绕一个任务从需求进入到最终交付的链路展开：

1. 创建任务
2. Qualify 任务
3. 创建计划
4. 提交审核
5. 批准或退回
6. 创建 work item
7. 更新执行进度
8. 添加 artifact
9. 查看任务时间线与 runtime 行为

## 页面说明

### Board

适合做全局总览：

- 看任务总体状态
- 看 runtime 当前是否在运行
- 手动执行 `Run Now`
- 暂停或恢复 runtime
- 查看 runtime audit 摘要

### Attention

适合查看需要优先关注的任务：

- 需要干预的任务
- 被卡住的任务
- 长时间 blocked 的任务

### Teams

适合从执行队列角度看问题：

- 按团队查看 work item
- 看每个团队当前正在处理什么
- 看交付执行压力分布

### Task Detail

这是最核心的单任务工作台：

- 查看任务基础信息
- 查看计划和审核状态
- 创建 work item
- 更新 work item 进度
- 挂 artifact
- 执行 supervisor 动作
- 查看 activity timeline
- 查看 runtime 生成的动作和审计信息

### Settings

用于系统级控制：

- 切换当前 actor 身份
- 查看 runtime 状态
- 执行全局 runtime 控制

## 推荐使用流程

### 1. 创建任务

在 `Board` 页面创建一个任务，填写标题、摘要和目标。

### 2. Qualify 任务

确认任务是否可以进入规划阶段，补充必要的上下文。

### 3. 创建计划

为任务增加 plan，明确交付思路、执行策略和需要的团队。

### 4. 提交审核

把计划送入 review 流程，由对应 reviewer 批准、拒绝或要求修改。

### 5. 批准后进入执行

批准后有两种方式进入执行：

- 手动创建 work item
- 让 runtime 自动生成 work item

### 6. 跟踪执行

在 `Task Detail` 或 `Teams` 页面更新 work item 进度，观察任务是否进入：

- `InExecution`
- `ReadyToReport`
- `Done`

### 7. 产出 artifact

把文档、结果、链接等作为 artifact 挂到任务上，形成交付留痕。

### 8. 处理异常

如果任务阻塞或流程异常，可以：

- 在 `Attention` 页面查看高优先级问题
- 在 `Task Detail` 中执行 supervisor 动作
- 用 runtime task-level controls 单独对一个任务做 run/sweep

## 角色切换怎么用

系统当前支持通过 actor 切换模拟不同角色：

- IntakeCoordinator
- ProjectManager
- SolutionReviewer
- DeliveryManager
- WorkflowSupervisor
- System

不同角色可执行的动作不同，所以如果某个按钮不可用，先检查当前 actor。

## Runtime 是什么

runtime 是后台 orchestration 逻辑，用来自动推进部分任务状态，例如：

- 为已批准任务生成 work item
- 推进已完成执行的任务
- 识别长时间 blocked 的任务并触发 escalation

你可以：

- 在 `Board` 页面全局控制它
- 在 `Settings` 页面查看和控制它
- 在 `Task Detail` 页面只对当前任务执行一次 runtime 动作

## 当前已知限制

- 没有完整认证与真实用户系统
- 当前角色更多是演示型 actor context
- `Inbox` 和 `Templates` 页面暂未实现
- 当前更偏向 demo / MVP / 设计验证

## 推荐阅读顺序

1. [安装部署指南](/root/edict/modern_delivery_os/docs/install-guide.md)
2. [用户指南](/root/edict/modern_delivery_os/docs/user-guide.md)
3. [最终方案](/root/edict/modern_delivery_os/docs/final-plan.md)
