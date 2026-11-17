# dsh-ppt-master-local

把 [ppt-master](https://github.com/hugohe3/ppt-master)（Hugo He 的 MIT 协议 PPT 生成工作流）作为 **DeepSeek Harness (DSH)** 技能装进你的 dsh。

本包**自包含**：完整的 ppt-master skill 树（skills/ppt-master，约 13,000 个文件）直接随包分发，安装后无需任何同级目录或外部检出。相对上游 6.9.0 只有**一处本地修改**：qwen 图像后端的模型白名单加入 `qwen-image-3.0`（上游只认 qwen-image-2.0-pro），其余文件与上游逐字节一致。

装好后，对话里说「用 ppt-master 给我做一份 PPT」即可触发完整的生成 / 美化 / 模板 / 原生编辑工作流。

## 安装

```bash
# git 仓库方式
dsh plugin --profile web add https://github.com/friendllcc/dsh-ppt-master-local.git

# 或 release tgz 方式（始终最新版）
dsh plugin --profile web add https://github.com/friendllcc/dsh-ppt-master-local/releases/latest/download/dsh-ppt-master-local.tgz
```

桌面端把 `--profile web` 换成 `--profile desktop`。安装后**重启一次 dsh 宿主**。

验证：新会话里让 agent 列出可见技能，应包含 `ppt-master`。

## 前置依赖

| 依赖 | 说明 |
|---|---|
| **Node.js ≥ 20** | dsh 插件运行时（dsh 自身已带） |
| **Python 3.10+** | ppt-master 脚本套件（生成 PPTX 必需） |
| **python-pptx / PyYAML / Pillow** | 核心依赖：`python -m pip install -r <插件目录>/skills/ppt-master/requirements.txt` |

requirements.txt 里其余依赖（edge-tts 旁白、PyMuPDF 转换等）按需安装。

## 图像生成配置（可选）

ppt-master 的 AI 配图走 `skills/ppt-master/scripts/image_gen.py`，配置来自 `.env`，查找顺序：

1. 会话工作目录 `./.env`
2. 技能目录 `.env`（`<插件目录>/skills/ppt-master/.env`）
3. `~/.ppt-master/.env`

模板见 `skills/ppt-master/.env.example`。以阿里云 DashScope（qwen-image-3.0）为例：

```ini
IMAGE_BACKEND=qwen
QWEN_API_KEY=sk-你的key
QWEN_MODEL=qwen-image-3.0
QWEN_BASE_URL=https://dashscope.aliyuncs.com
```

注意：DashScope 的 OpenAI 兼容入口（`/compatible-mode/v1`）**不开放** images 接径，请使用上面 qwen 后端的原生端点写法。不配 `.env` 时，Agent 会走宿主的原生图像工具（如已安装的图像生成插件）或提示你手动出图。

**不要把你的 `.env` 提交进任何仓库**——本包发布物中不含任何密钥。

## 已知问题与本地修复

- DashScope `compatible-mode` 无 images 路径（404）→ 用 qwen 后端 + 原生端点（上文配置即正确写法）。
- 若系统环境变量里残留旧的 `DASHSCOPE_API_KEY`（欠费账户），宿主原生图像工具可能优先使用它 → 在 dsh 设置里保存正确 key（凭据库优先级高于环境变量），或删除该系统变量。

## 致谢与许可

- 上游 ppt-master：[hugohe3/ppt-master](https://github.com/hugohe3/ppt-master)，MIT © 2025-2026 Hugo He（技能树内含其 LICENSE / SPONSORS 声明，`attribution_guard.py` 完整性门逐次校验）。
- 本包装层：MIT，见 [LICENSE](LICENSE)。

## 开发

仓库即包根。改完 `skills/` 下的内容后重启 dsh 宿主即可生效（技能正文每次 apply 现读）。环境变量 `DSH_PPT_MASTER_SKILL_DIR` 可强制指向另一份技能目录用于调试。
