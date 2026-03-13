# Usage Manual

## Who This Is For

This guide is for people who already have the system running and want to know
how to use it effectively.

## Core Product Flow

The product centers on moving a task from intake to delivery:

1. Create a task
2. Qualify the task
3. Create a plan
4. Submit for review
5. Approve or request changes
6. Create work items
7. Update execution progress
8. Attach artifacts
9. Inspect task timeline and runtime behavior

## Page Guide

### Board

Best for overall visibility:

- review overall task status
- see whether runtime is running
- manually trigger `Run Now`
- pause or resume runtime
- inspect runtime audit summary

### Attention

Best for priority follow-up:

- tasks that need intervention
- tasks that are stuck
- tasks blocked for a long time

### Teams

Best for execution-queue monitoring:

- view work items by team
- see what each team is handling
- understand delivery load distribution

### Task Detail

This is the main single-task workspace:

- inspect task metadata
- inspect planning and review state
- create work items
- update work item progress
- attach artifacts
- perform supervisor actions
- inspect the activity timeline
- inspect runtime-generated actions and audit data

### Settings

Used for system-level controls:

- switch the current actor identity
- inspect runtime status
- perform global runtime controls

## Recommended Workflow

### 1. Create a Task

Create a task from the `Board` page with a title, summary, and goal.

### 2. Qualify the Task

Confirm that the request is ready for planning and add required context.

### 3. Create a Plan

Add a plan that describes the delivery approach, execution strategy, and teams involved.

### 4. Submit For Review

Send the plan into review so a reviewer can approve it, reject it, or request changes.

### 5. Move Into Execution

After approval, execution can start in two ways:

- create work items manually
- let runtime generate work items automatically

### 6. Track Execution

Use `Task Detail` or `Teams` to update work item progress and monitor whether the task moves into:

- `InExecution`
- `ReadyToReport`
- `Done`

### 7. Add Artifacts

Attach documents, results, or links as artifacts so the delivery output is traceable.

### 8. Handle Exceptions

If a task is blocked or the workflow needs help, you can:

- inspect high-priority items in `Attention`
- perform supervisor actions in `Task Detail`
- use task-level runtime controls to run or sweep a single task

## How Actor Switching Works

The system currently supports actor switching to simulate different workflow roles:

- IntakeCoordinator
- ProjectManager
- SolutionReviewer
- DeliveryManager
- WorkflowSupervisor
- System

Each role can perform different actions, so if a button is unavailable, check the current actor first.

## What Runtime Means

Runtime is the background orchestration logic that automatically advances parts of the workflow, for example:

- generating work items for approved tasks
- advancing completed execution
- escalating tasks that stay blocked too long

You can control it from:

- `Board` for global controls
- `Settings` for status and controls
- `Task Detail` for single-task actions

## Current Known Limits

- No full authentication or real user system yet
- Roles are currently demo-style actor contexts
- `Inbox` and `Templates` pages are not implemented yet
- The current product is best treated as a demo / MVP / design-validation system

## Recommended Reading Order

1. [Installation Guide](/root/edict/companyagents/docs/install-guide_EN.md)
2. [User Guide](/root/edict/companyagents/docs/user-guide_EN.md)
3. [Final Plan](/root/edict/companyagents/docs/final-plan_EN.md)
