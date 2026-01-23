<p align="center"><img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/libro-text.svg" width="160" /></p>
<p align="center"><strong>A Notebook Product Solution with Flexible Customization and Easy Integration</strong></p>

<p align="center">
<a href="https://github.com/difizen/libro/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/difizen/libro/ci.yml?branch=main&style=for-the-badge&logo=github" alt="Code: CI" style="max-width: 100%;" height="20px"></a>
<a href="/LICENSE"><img src="https://img.shields.io/github/license/difizen/libro?style=for-the-badge" alt="MIT License" height="20px"></a>
<a href="https://www.npmjs.com/package/@difizen/libro-core"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@difizen/libro-core?logo=npm&style=for-the-badge" height="20px"></a>
<a href="https://github.com/difizen/libro/pulls"><img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge" height="20px"></a>
<a href="https://libro.difizen.net"><img alt="website" src="https://img.shields.io/static/v1?label=&labelColor=505050&message=Homepage&color=0076D6&style=for-the-badge&logo=google-chrome&logoColor=f5f5f5" height="20px"></a>
<a href="https://discord.gg/GEx6pa3GaG"><img alt="discord" src="https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white" height="20px"></a>
</p>

## Features

- 🚀 Provides comprehensive Notebook functionality with a rich set of auxiliary tools, allowing for quick adoption based on existing setups.
- 🌱 Supports kernel-level extensibility, enabling customization and further development at all layers.
- 🔮 Defines workflows for large models, with built-in capabilities for model interaction and AI-powered assistance.

![image](https://raw.githubusercontent.com/wiki/difizen/libro/assets/libro_homepage.png)

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of Contents

- [Quick Start](#quick-start)
  - [Install](#install)
  - [Run](#run)
- [New Features](#new-features)
  - [AI Capability](#ai-capability)
  - [Prompt Cell](#prompt-cell)
  - [Sql Cell](#sql-cell)
- [Technical Architecture](#technical-architecture)
- [Future Plans](#future-plans)
- [More](#more)
  - [Reporting Issues](#reporting-issues)
  - [Contributing](#contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## Quick Start

### Install

```bash
pip install libro
```

> [!NOTE]
> The Python version used is 3.10-3.12. Higher versions of Python may encounter issues with unsupported dependencies.

### Run

Enter command `libro` in the terminal to start the web server, then the browser will automatically launch Libro.

```bash
libro
```

![image](https://raw.githubusercontent.com/wiki/difizen/libro/assets/libro_launch.png)

For more details, please refer to [quick start](./apps/docs/docs/quickstart/index.md)。

## New Features

### AI Capability

<table align="center">
  <tr>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/ai_completion.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/ai_completion.gif" alt="Image 1" width="150" height="100">
      </a>
      <p>AI Comletion</p>
    </td>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/error_debug.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/error_debug.gif" alt="Image 2" width="150" height="100">
      </a>
      <p>Error Fixing</p>
    </td>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_chat.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_chat.gif" alt="Image 3" width="150" height="100">
      </a>
      <p>AI Chat</p>
    </td>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_explain.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_explain.gif" alt="Image 4" width="150" height="100">
      </a>
      <p>Code Explanation</p>
    </td>
    <td align="center">
      <a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_opitimization.gif" target="_blank">
        <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/cell_opitimization.gif" alt="Image 5" width="150" height="100">
      </a>
      <p>Code Optimization</p>
    </td>
  </tr>
</table>

Click to enlarge

### Prompt Cell

- Enhances the ability to interact directly with large models, supporting text conversations, multimodal expressions, and more.
- Improves interaction capabilities for common output types, such as providing options to copy or run code when outputting it.
- Built-in OpenAI models are available, and you can also extend models in the following ways:
  - Define variables for LLMs, agents, and other dialogue objects based on Langchain, which can be directly used in Prompt Cells.
  - Extend your own models based on libro-ai.

For more details, please refer to [prompt cell manual](./apps/docs/docs/manual/prompt-cell.md)。

<a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/prompt_cell.gif" target="_blank">
  <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/prompt_cell.gif" alt="prompt cell" width="150" height="100">
</a>

Click to enlarge

### Sql Cell

- Supports interaction capabilities for executing SQL commands.
- Connect to SQL databases to write SQL code directly in the notebook.

For more details, please refer to [sql cell manual](./apps/docs/docs/manual/sql-cell.md)。

<a href="https://raw.githubusercontent.com/wiki/difizen/libro/assets/sql_cell.gif" target="_blank">
  <img src="https://raw.githubusercontent.com/wiki/difizen/libro/assets/sql_cell.gif" alt="sql cell" width="150" height="100">
</a>

Click to enlarge

## Technical Architecture

![image](https://raw.githubusercontent.com/wiki/difizen/libro/assets/technical_architecture.png)

## Future Plans

- AI Capability Integration
- Support for Prompt Notebook
- Execution of libro in the Browser

## More

### Reporting Issues

😊 We recommend submitting your questions through [github issue](https://github.com/difizen/libro/issues), and we typically respond within two days.

### Contributing

🤝 Please refer to [CONTRIBUTING.md](./CONTRIBUTING.md)
<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/41573506?v=4" width="80px;"/><br/><sub><b>sunshinesmilelk</b></sub>](https://github.com/sunshinesmilelk)<br/>|[<img src="https://avatars.githubusercontent.com/u/11978904?v=4" width="80px;"/><br/><sub><b>BroKun</b></sub>](https://github.com/BroKun)<br/>|[<img src="https://avatars.githubusercontent.com/u/4224253?v=4" width="80px;"/><br/><sub><b>zhanba</b></sub>](https://github.com/zhanba)<br/>|[<img src="https://avatars.githubusercontent.com/u/5857931?v=4" width="80px;"/><br/><sub><b>HellowVirgil</b></sub>](https://github.com/HellowVirgil)<br/>|[<img src="https://avatars.githubusercontent.com/u/1011681?v=4" width="80px;"/><br/><sub><b>xudafeng</b></sub>](https://github.com/xudafeng)<br/>|[<img src="https://avatars.githubusercontent.com/u/24583897?v=4" width="80px;"/><br/><sub><b>huxiamei</b></sub>](https://github.com/huxiamei)<br/>|
| :---: | :---: | :---: | :---: | :---: | :---: |
|[<img src="https://avatars.githubusercontent.com/u/6045824?v=4" width="80px;"/><br/><sub><b>bubkoo</b></sub>](https://github.com/bubkoo)<br/>|[<img src="https://avatars.githubusercontent.com/u/18068822?v=4" width="80px;"/><br/><sub><b>xujingli</b></sub>](https://github.com/xujingli)<br/>|[<img src="https://avatars.githubusercontent.com/u/20186737?v=4" width="80px;"/><br/><sub><b>NewByVector</b></sub>](https://github.com/NewByVector)<br/>|[<img src="https://avatars.githubusercontent.com/u/93302820?v=4" width="80px;"/><br/><sub><b>tonywu6</b></sub>](https://github.com/tonywu6)<br/>|[<img src="https://avatars.githubusercontent.com/u/37138631?v=4" width="80px;"/><br/><sub><b>coetzeexu</b></sub>](https://github.com/coetzeexu)<br/>|[<img src="https://avatars.githubusercontent.com/u/16317354?v=4" width="80px;"/><br/><sub><b>lulusir</b></sub>](https://github.com/lulusir)<br/>|
[<img src="https://avatars.githubusercontent.com/u/30524126?v=4" width="80px;"/><br/><sub><b>z0gSh1u</b></sub>](https://github.com/z0gSh1u)<br/>

This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Fri Jan 23 2026 22:16:34 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->