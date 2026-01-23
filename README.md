<p align="center"><img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/libro-text.svg" width="160" /></p>
<p align="center"><strong>libro：灵活定制、轻松集成的 Notebook 产品方案</strong></p>

<p align="center">
<a href="https://github.com/difizen/libro/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/difizen/libro/ci.yml?branch=main&style=for-the-badge&logo=github" alt="Code: CI" style="max-width: 100%;" height="20px"></a>
<a href="/LICENSE"><img src="https://img.shields.io/github/license/difizen/libro?style=for-the-badge" alt="MIT License" height="20px"></a>
<a href="https://www.npmjs.com/package/@difizen/libro-core"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@difizen/libro-core?logo=npm&style=for-the-badge" height="20px"></a>
<a href="https://github.com/difizen/libro/pulls"><img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge" height="20px"></a>
<a href="https://libro.difizen.net"><img alt="website" src="https://img.shields.io/static/v1?label=&labelColor=505050&message=Homepage&color=0076D6&style=for-the-badge&logo=google-chrome&logoColor=f5f5f5" height="20px"></a>
<a href="https://discord.gg/GEx6pa3GaG"><img alt="discord" src="https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white" height="20px"></a>
</p>

## 特性

- 🚀 提供完整的 Notebook 能力和丰富的周边功能，基于现有组合快速上手。
- 🌱 提供内核级别的扩展能力，所有层次的内容均允许二次开发定制。
- 🔮 定义大模型工作流，内置大模型交互和辅助开发能力。

![image](https://raw.githubusercontent.com/wiki/difizen/libro/assets/libro_homepage_zh.png)

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## 目录

- [快速开始](#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)
  - [安装](#%E5%AE%89%E8%A3%85)
  - [启动](#%E5%90%AF%E5%8A%A8)
- [新特性](#%E6%96%B0%E7%89%B9%E6%80%A7)
  - [AI 能力](#ai-%E8%83%BD%E5%8A%9B)
  - [Prompt Cell](#prompt-cell)
  - [Sql Cell](#sql-cell)
- [架构](#%E6%9E%B6%E6%9E%84)
- [后续计划](#%E5%90%8E%E7%BB%AD%E8%AE%A1%E5%88%92)
- [更多](#%E6%9B%B4%E5%A4%9A)
  - [提交issue](#%E6%8F%90%E4%BA%A4issue)
  - [贡献代码](#%E8%B4%A1%E7%8C%AE%E4%BB%A3%E7%A0%81)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## 快速开始

### 安装
```bash
pip install libro
```

> [!NOTE]
> 使用的 Python 版本为 3.10-3.12，过高的 Python 版本可能存在依赖包不支持的问题。

详情请阅读[快速开始](./apps/docs/docs/quickstart/index.md)。

### 启动
在终端中输入命令 `libro` 启动 Web 服务器，随后浏览器会自动打开 Libro。

```bash
libro
```
![image](https://raw.githubusercontent.com/wiki/difizen/libro/assets/libro_launch.png)

## 新特性

### AI 能力

<table align="center">
  <tr>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/ai_completion_zh.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/ai_completion_zh.gif" alt="AI 代码补全" width="150" height="100">
      </a>
      <p>AI 代码补全</p>
    </td>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/error_debug_zh.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/error_debug_zh.gif" alt="错误修复" width="150" height="100">
      </a>
      <p>错误修复</p>
    </td>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_chat_zh.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_chat_zh.gif" alt="AI 对话" width="150" height="100">
      </a>
      <p>AI 对话</p>
    </td>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_explain_zh.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_explain_zh.gif" alt="代码解释" width="150" height="100">
      </a>
      <p>代码解释</p>
    </td>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_opitimization_zh.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_opitimization_zh.gif" alt="代码优化" width="150" height="100">
      </a>
      <p>代码优化</p>
    </td>
  </tr>
</table>


### Prompt Cell

- 增强直接与大模型交互的能力，支持文本对话，多模态表达等。
- 增强对于常见输出类型的交互能力，如在输出代码时给出复制、运行等操作能力。
- 内置了 OpenAI 系列模型，您还可以通过以下方式扩展模型～
  - 基于 langchain 定义 llm、agent 等可对话对象的变量，他们可以直接用在 Prompt cell 中。
  - 基于 libro-ai 扩展自己的模型。
- 支持选择聊天标识，使得选择该聊天标识的 Prompt Cell 都在一个聊天上下文中。
- 支持 Prompt Cell 保存为一个变量，该变量即为 langchain 的 AIMessage。

详情请阅读 [prompt cell 指南](./apps/docs/docs/manual/prompt-cell.md)。

<a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/prompt_cell_zh.gif" target="_blank">
  <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/prompt_cell_zh.gif" alt="prompt cell" width="150" height="100">
</a>

### Sql Cell

- 支持与 sql 的执行交互能力。
- 连接 sql 数据库即可在 notebook 中写 sql 代码。

详情请阅读 [sql cell 指南](./apps/docs/docs/manual/sql-cell.md)。

<a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/sql_cell.gif" target="_blank">
  <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/sql_cell_zh.gif" alt="sql cell" width="150" height="100">
</a>

## 架构

![image](https://raw.githubusercontent.com/wiki/difizen/libro/assets/technical_architecture_zh.png)

## 后续计划

- AI 特性接入
- Libro 在浏览器端执行
- 版本 Diff 接入

## 更多

### 提交issue

😊 我们建议您使用[github issue](https://github.com/difizen/libro/issues) 提交您的疑问, 我们通常会在2日内回复。

<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/41573506?v=4" width="80px;"/><br/><sub><b>sunshinesmilelk</b></sub>](https://github.com/sunshinesmilelk)<br/>|[<img src="https://avatars.githubusercontent.com/u/11978904?v=4" width="80px;"/><br/><sub><b>BroKun</b></sub>](https://github.com/BroKun)<br/>|[<img src="https://avatars.githubusercontent.com/u/4224253?v=4" width="80px;"/><br/><sub><b>zhanba</b></sub>](https://github.com/zhanba)<br/>|[<img src="https://avatars.githubusercontent.com/u/5857931?v=4" width="80px;"/><br/><sub><b>HellowVirgil</b></sub>](https://github.com/HellowVirgil)<br/>|[<img src="https://avatars.githubusercontent.com/u/1011681?v=4" width="80px;"/><br/><sub><b>xudafeng</b></sub>](https://github.com/xudafeng)<br/>|[<img src="https://avatars.githubusercontent.com/u/24583897?v=4" width="80px;"/><br/><sub><b>huxiamei</b></sub>](https://github.com/huxiamei)<br/>|
| :---: | :---: | :---: | :---: | :---: | :---: |
|[<img src="https://avatars.githubusercontent.com/u/6045824?v=4" width="80px;"/><br/><sub><b>bubkoo</b></sub>](https://github.com/bubkoo)<br/>|[<img src="https://avatars.githubusercontent.com/u/18068822?v=4" width="80px;"/><br/><sub><b>xujingli</b></sub>](https://github.com/xujingli)<br/>|[<img src="https://avatars.githubusercontent.com/u/20186737?v=4" width="80px;"/><br/><sub><b>NewByVector</b></sub>](https://github.com/NewByVector)<br/>|[<img src="https://avatars.githubusercontent.com/u/93302820?v=4" width="80px;"/><br/><sub><b>tonywu6</b></sub>](https://github.com/tonywu6)<br/>|[<img src="https://avatars.githubusercontent.com/u/37138631?v=4" width="80px;"/><br/><sub><b>coetzeexu</b></sub>](https://github.com/coetzeexu)<br/>|[<img src="https://avatars.githubusercontent.com/u/16317354?v=4" width="80px;"/><br/><sub><b>lulusir</b></sub>](https://github.com/lulusir)<br/>|
[<img src="https://avatars.githubusercontent.com/u/30524126?v=4" width="80px;"/><br/><sub><b>z0gSh1u</b></sub>](https://github.com/z0gSh1u)<br/>

This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Fri Jan 23 2026 22:16:34 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->
