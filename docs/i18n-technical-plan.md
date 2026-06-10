# CSPM 中英日国际化技术方案

更新时间：2026-06-07 15:30 CST

## 目标

为 CSPM 核心产品体验实现英文、简体中文、日文三种语言。

支持语言：

- `en`
- `zh-CN`
- `ja-JP`

实现时必须保持原始业务数据和 API 兼容性。枚举原始值、资源 ID、云账号 ID、ARN、region、邮箱、名称、provider UID、云厂商原始返回字段都不能被翻译或覆盖。

## 最终范围

首期包含：

- 扫描：`scans`
- 云账号 / Provider：`providers`
- 风险发现：`findings`
- 资源：`resources`
- 合规概览和合规详情：`compliance overviews / details`
- 报告下载和报告生成
- 用户和角色：如果产品保留这些页面，则覆盖基础文案和展示字段
- API 错误、校验提示、空状态、常见展示标签
- 检查项 metadata：标题、描述、风险、修复建议
- 合规 metadata：框架名称、要求名称、描述、section、subsection

首期不包含：

- 大的静默规则 / suppression rules / mute rules
- Jira 连携
- Slack 连携
- S3 连携
- AWS Security Hub 连携
- 其他第三方软件集成
- 第三方推送 payload 的多语言
- 云资源原始标识翻译，例如 ARN、账号 ID、region、resource name、email、role key、provider UID、raw metadata

## 当前真实状态

本次检查的真实后端源码位于运行中的 API 容器：

```text
/home/prowler/backend
```

对应镜像和容器：

```text
cspm-backend-main-api:latest
cspm-backend-main-restore-api-1
```

当前后端国际化能力：

- `api/v1/serializer_utils/check_metadata_i18n.py` 已经提供检查项 metadata 本地化加载逻辑。
- `FindingSerializer` 和 `FindingIncludeSerializer` 会读取 `Accept-Language`。
- 目前只有 findings 的 `check_metadata` 接入了这套本地化逻辑。
- 大多数 serializer 没有读取 `Accept-Language`。
- `views.py` 只给 finding list/retrieve 加了 `Vary: Accept-Language`。
- Django 开了 `USE_I18N`，但 `LANGUAGES` 当前只有英文。
- 当前没有完整启用 Django `.po/.mo` 翻译工作流来支撑 `zh-CN` 和 `ja-JP`。

当前语言归一化规则：

```text
zh, zh-CN, zh-cn, zh-Hans-CN -> zh-CN
ja, ja-JP, ja-jp             -> ja-JP
missing / en / unsupported   -> 不返回本地化 metadata，回退原始 metadata
```

已验证样例：

```text
provider: aws
check_id: accessanalyzer_enabled

zh-CN -> IAM Access Analyzer 已启用
ja-JP -> IAM Access Analyzer が有効になっています
```

## 当前 Metadata 覆盖情况

当前后端镜像里的检查项 metadata 文件覆盖：

```text
provider          en    zh-CN  ja-JP
aws               575   531    531
azure             166   166    166
gcp               95    0      0
kubernetes        83    0      0
github            20    0      0
m365              70    0      0
oraclecloud       51    0      0
alibabacloud      63    0      0
mongodbatlas      10    0      0
nhn               6     0      0
```

结论：

- AWS 和 Azure 已经有比较完整的中文、日文检查项 metadata。
- 其他 provider 基本没有中文、日文 metadata。
- 这是内容资产缺口，不只是接口逻辑缺口。

## 为什么之前下载报告全是英文

AWS 虽然有中文和日文 metadata，但最初下载的报告是英文，原因是：报告下载链路没有走 `FindingSerializer` 的本地化逻辑。

Finding API 链路：

```text
GET /api/v1/findings
Accept-Language: zh-CN
-> FindingSerializer
-> get_localized_check_metadata()
-> API 响应里的 check_metadata 变成中文
```

报告生成 / 下载链路：

```text
扫描完成
-> generate_outputs_task
-> 从数据库 finding 对象转换输出数据
-> 生成 CSV / JSON / ASFF / OCSF / HTML
-> 压缩成 ZIP
-> 写入 scan.output_location
用户点击下载
-> 直接返回已有 ZIP
```

关键点：

- 报告是在扫描完成后生成的，不是在点击下载时生成的。
- 点击下载只是取已有文件，不会根据当前界面语言重新生成。
- 当前报告生成任务没有 `locale` 参数。
- 报告生成使用数据库里保存的 finding metadata 和 Prowler 输出 writer。
- 数据库里的 finding metadata 通常是英文。
- 当前 `Accept-Language` 只影响 findings API 的 `check_metadata`，不影响 ZIP/PDF/CSV/HTML 报告。

所以，当前下载英文报告是符合现有逻辑的，不代表 AWS 没有中文 metadata。

## 报告类型范围

项目当前支持多类输出和报告：

1. 主扫描结果 ZIP
   - CSV
   - OCSF JSON
   - ASFF JSON，AWS Security Hub 条件下生成
   - HTML

2. 合规 CSV 输出
   - 按可用 compliance framework 生成

3. PDF 报告
   - ThreatScore
   - ENS
   - NIS2

当前报告实现情况：

- 主扫描输出由 `generate_outputs_task` 生成。
- 输出 writer 来自 `prowler.lib.outputs`。
- 合规 PDF 报告由 `generate_compliance_reports_task` 触发。
- `tasks/jobs/report.py` 中有大量硬编码英文和西语文案。
- 下载接口只是从 `scan.output_location` 或相邻报告目录读取已有文件。

## 目标架构

采用“四层国际化”方案，不推倒重来。

```text
Django i18n
  负责错误提示、校验提示、枚举 label、固定后端文案、邮件/模板

Check metadata i18n
  负责检查项标题、描述、风险、修复建议

Compliance metadata i18n
  负责合规框架名称、要求名称、要求描述、section、subsection

Report i18n
  负责报告标题、表头、标签、枚举展示值、metadata 注入
```

Django 自带 i18n 是底座，但不能单独完成这个项目的全部国际化。检查项、合规框架和报告都属于内容资产国际化，需要单独处理。

## API 语言协议

所有需要本地化的接口统一读取：

```http
Accept-Language: zh-CN
```

本地化响应统一返回：

```http
Content-Language: zh-CN
Vary: Accept-Language
```

fallback 规则：

```text
zh, zh-CN, zh-cn, zh-Hans-CN -> zh-CN
ja, ja-JP, ja-jp             -> ja-JP
缺失 / en / 不支持            -> en
```

建议新增公共工具模块：

```text
api/v1/i18n/
  locales.py
  enums.py
  metadata.py
  compliance.py
```

建议核心函数：

```python
normalize_locale(raw_accept_language: str | None) -> str
get_request_locale(request) -> str
localized_enum(enum_type: str, value: str, locale: str) -> str
localized_check_metadata(provider: str, check_id: str, locale: str) -> dict
localized_compliance(provider: str, compliance_id: str, locale: str) -> dict
```

## API 字段策略

不翻译、不覆盖原始字段。需要展示中文/日文时，新增 display 字段。

示例：

```json
{
  "status": "FAIL",
  "status_display": "失败",
  "severity": "low",
  "severity_display": "低",
  "state": "completed",
  "state_display": "已完成"
}
```

建议通用展示字段：

- `status_display`
- `severity_display`
- `state_display`
- `trigger_display`
- `delta_display`
- `role_display`
- `provider_display`
- `metadata_locale`
- `metadata_fallback`

Findings 特别说明：

- 保留 `status`、`severity`、`check_id`、`status_extended` 原始值。
- `check_metadata` 可以按语言返回本地化内容。
- 可以考虑新增 `status_extended_display`，但不能简单机器翻译，因为它可能包含资源名、账号、region 等运行时文本。
- 不要静默覆盖数据库中的英文 `status_extended`。

## Django i18n 改造

需要做：

1. 增加语言配置：

```python
LANGUAGES = [
    ("en", "English"),
    ("zh-CN", "Simplified Chinese"),
    ("ja-JP", "Japanese"),
]
```

2. 增加或确认中间件：

```python
django.middleware.locale.LocaleMiddleware
```

3. 增加 locale 路径和翻译文件：

```text
locale/
  zh_CN/LC_MESSAGES/django.po
  ja/LC_MESSAGES/django.po
```

4. 执行：

```bash
django-admin makemessages -l zh_CN
django-admin makemessages -l ja
django-admin compilemessages
```

5. 翻译范围：

- model 枚举 label
- serializer 校验错误
- 后端固定错误提示
- 邮件/模板文案，如果存在
- 固定响应文案

## Check Metadata i18n 改造

继续沿用当前已有格式：

```text
check_id.metadata.json
check_id.metadata.zh-CN.json
check_id.metadata.ja-JP.json
```

需要做：

- 复用当前 AWS/Azure 已有本地化 metadata。
- 补齐 AWS 中英文、日文缺失的部分。
- 为 GCP 增加 zh-CN 和 ja-JP metadata。
- 为 Kubernetes 增加 zh-CN 和 ja-JP metadata。
- 为 GitHub 增加 zh-CN 和 ja-JP metadata。
- 为 M365 增加 zh-CN 和 ja-JP metadata。
- 为 Oracle Cloud 增加 zh-CN 和 ja-JP metadata。
- 为 Alibaba Cloud 增加 zh-CN 和 ja-JP metadata。
- 如果 MongoDB Atlas、NHN 仍在范围内，也补齐 zh-CN 和 ja-JP metadata。

校验要求：

- 本地化 metadata 必须保留原始 `CheckID`。
- 不翻译机器稳定标识。
- JSON 结构必须和英文文件一致。
- 生成 provider + locale 维度的缺失统计。

## Compliance i18n 改造

当前 compliance framework JSON 没有发现 zh-CN / ja-JP 变体。

推荐使用 overlay 目录，减少对上游原始文件的侵入：

```text
prowler/compliance_i18n/
  zh-CN/
    aws/nis2_aws.json
    aws/prowler_threatscore_aws.json
  ja-JP/
    aws/nis2_aws.json
    aws/prowler_threatscore_aws.json
```

也可以使用同目录变体：

```text
prowler/compliance/aws/nis2_aws.json
prowler/compliance/aws/nis2_aws.zh-CN.json
prowler/compliance/aws/nis2_aws.ja-JP.json
```

推荐 overlay 方案：

- 保持原始 compliance 文件稳定。
- ID、check 映射、status 等机器字段不变。
- 本地化 framework name、description、requirement name、requirement description、section、subsection。

## Report i18n 改造

报告必须在生成或预处理时带 locale。只在下载时简单包装已有英文 ZIP 是不够的。

### 报告数据映射原则

数据库继续保存原始扫描数据，不为了报告语言切换而把数据库内容更新成中文或日文。

报告生成时根据当前请求语言做一层展示映射：

```text
数据库原始数据
-> 读取当前语言 en / zh-CN / ja-JP
-> 枚举字段映射为当前语言展示值
-> 通过 check_id 查找当前语言 check metadata
-> 通过 compliance_id 查找当前语言 compliance metadata
-> 保留账号 ID、ARN、region、资源名等原始字段
-> 生成当前语言报告
-> 缓存当前语言报告产物
```

示例：

```text
DB: status = FAIL
zh-CN 报告: 失败
ja-JP 报告: 失敗
en 报告: Fail
```

```text
DB: check_id = accessanalyzer_enabled
zh-CN 报告: IAM Access Analyzer 已启用
ja-JP 报告: IAM Access Analyzer が有効になっています
en 报告: IAM Access Analyzer enabled
```

`status_extended` 这类字段需要谨慎处理。它通常是扫描时生成的英文句子，并且可能包含账号、region、资源名等动态内容。首期不建议直接机器翻译或覆盖该字段，报告中应优先使用本地化 metadata、枚举 display 和原始资源字段重新组织说明；原始 `status_extended` 可以作为“原始扫描说明”保留。

推荐策略：下载触发的按需预处理。

也就是说，不在扫描结束时一次性生成 `en`、`zh-CN`、`ja-JP` 三份完整报告，而是在用户点击下载时，根据当前请求语言查找或生成对应语言产物。

推荐缓存路径：

```text
outputs/{tenant_id}/{scan_id}/en/
outputs/{tenant_id}/{scan_id}/zh-CN/
outputs/{tenant_id}/{scan_id}/ja-JP/
```

下载行为：

```text
读取请求语言
-> 查找对应语言报告产物
-> 如果存在，直接下载
-> 如果不存在，进入下载时预处理
-> 轻量报告可同步生成并直接返回
-> 重型 ZIP/PDF 触发异步生成并返回“报告生成中”
```

这样可以避免扫描完成时无条件生成三份报告，也能保证下载语言和用户当前语言一致。

任务改造：

- 给扫描输出任务增加 `locale` 参数。
- 给合规报告任务增加 `locale` 参数。
- 增加下载时报告预处理入口，根据 `scan_id + locale + report_type` 查找或生成产物。
- 报告转换 finding 时使用本地化 check metadata。
- 报告生成合规内容时使用本地化 compliance metadata。
- 人读报告使用本地化 enum display。
- JSON 类机器可读输出保留原始字段。

报告需要本地化的内容：

- 报告标题
- section 标题
- 表头
- 图表标签
- 摘要字段
- severity/status 展示值
- 合规 section 标签
- 无数据提示
- 错误和警告提示

不同报告类型策略：

- ZIP：按 locale 分别生成。
- HTML：按 locale 分别生成。
- CSV：至少本地化表头和人读展示值；机器字段保留原值。
- OCSF/ASFF JSON：优先保持 schema 字段稳定；如要加 display 字段，需确认消费方兼容。
- PDF：完整本地化人读文案。

## 前端要求

前端需要：

- 维护当前语言，只允许 `en`、`zh-CN`、`ja-JP`。
- 所有 API 请求发送 `Accept-Language`。
- 如果后端报告任务需要显式语言，启动生成任务时传递 locale。
- 优先使用后端返回的 display 字段展示枚举。
- 继续使用原始字段做筛选、排序、写入和接口交互。
- 必要时在调试模式展示 metadata fallback 状态。

注意：

- 只有前端 UI 翻译是不够的。
- 后端 API、本地化 metadata、合规内容、报告生成必须和当前语言一致。

## 执行顺序

第一阶段：审计和基础设施

- 生成接口和字段覆盖矩阵。
- 增加统一语言归一化工具。
- 增加支持语言常量。
- 增加 `Content-Language` 和 `Vary: Accept-Language` 处理。
- 增加 locale normalization 和 fallback 测试。

第二阶段：核心 API display 字段

- 给 scans 增加 display 字段。
- 给 findings 增加 display 字段。
- 给 resources 增加必要 display 字段。
- 给 providers 增加 display 字段。
- 给 compliance overviews/details 增加 display 字段。
- 如果保留 users/roles 页面，增加基础 display 字段。

第三阶段：检查项 metadata 本地化

- 将当前 `check_metadata_i18n` 整理进公共 i18n 工具。
- 增加 `metadata_locale` 和 `metadata_fallback`。
- 生成 metadata 覆盖统计。
- 按优先级补齐 zh-CN 和 ja-JP metadata。

第四阶段：合规内容本地化

- 增加 compliance i18n loader。
- API 响应增加本地化合规字段。
- 增加 fallback 行为和测试。

第五阶段：报告本地化

- 报告任务增加 locale 参数。
- 增加本地化输出路径规范。
- 本地化 ZIP / HTML / CSV 的人读内容。
- 本地化 ThreatScore PDF。
- 本地化 ENS PDF。
- 本地化 NIS2 PDF。
- 下载接口按当前语言选择对应报告产物。

第六阶段：前端接入

- 确认 API client 统一发送 `Accept-Language`。
- 确认报告下载/生成使用当前语言。
- 用后端 display 字段替换部分前端硬编码枚举映射。
- 原始字段继续用于逻辑判断。

第七阶段：验收验证

- 验证 `en`、`zh-CN`、`ja-JP` 三种语言核心页面。
- 验证缺失本地化 metadata 时 fallback 英文。
- 验证三种语言报告都能生成和下载。
- 验证历史扫描只有英文 DB metadata 时仍可生成本地化报告。
- 验证缓存不会串语言。
- 验证原始字段不变。

## 验收标准

中文模式：

- 核心 API display 字段返回中文。
- Findings 在 metadata 存在时返回中文检查项内容。
- 合规详情在本地化内容存在时返回中文 framework/requirement。
- 报告下载为中文。
- 缺失中文内容时 fallback 英文，并能标识 fallback。

日文模式：

- 核心 API display 字段返回日文。
- Findings 在 metadata 存在时返回日文检查项内容。
- 合规详情在本地化内容存在时返回日文 framework/requirement。
- 报告下载为日文。
- 缺失日文内容时 fallback 英文，并能标识 fallback。

英文模式：

- 当前英文行为保持稳定。
- 原始 API 字段保持兼容。
- 现有筛选、排序、扫描、下载和报告路由继续可用。

通用标准：

- 不翻译云资源原始标识。
- 不为了展示国际化覆盖数据库原始数据。
- 下载报告语言和当前产品语言一致。
- 如果本地化报告尚未生成，已有英文报告仍可下载或有明确状态提示。

## 主要风险

- AWS/Azure 之外的 metadata 翻译量较大。
- 合规框架翻译是单独的内容资产工程。
- 报告生成链路多，且存在大量硬编码文案。
- `status_extended` 很难安全本地化，因为它是带资源上下文的生成文本。
- 如果没有正确设置 `Vary: Accept-Language`，缓存可能返回错误语言。
- 如果所有语言都长期缓存报告产物，报告存储空间最多会接近三倍，需要过期清理策略。
- 下载时生成重型报告可能耗时较长，需要异步任务和明确的生成中状态。

## 推荐决策

- 不推倒重来。
- Django i18n 负责固定后端文案。
- 继续复用并扩展现有 check metadata 文件模式。
- 合规内容使用 overlay 本地化资产。
- 报告按下载请求语言做按需预处理，并按 locale 缓存独立产物。
- 增加 display 字段，不翻译原始字段。
- 首期排除 mute rules 和 Jira 等第三方连携。
