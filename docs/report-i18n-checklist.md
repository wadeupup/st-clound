# 报告 Value 翻译清单

本文档只记录报告里 **value** 的翻译情况，不记录标题、表头、label、说明文案。

## 1. 会翻译哪些 value 字段

当前报告实际会翻译的 value 字段只有这些：

| 报告字段 | 对应 label/含义 | 来源 |
| --- | --- | --- |
| `status_display` | 状态标签 | `status` |
| `severity_display` | 严重性标签 | `severity` |
| `check_title` | 检查项标题 | `CheckTitle` |
| `description` | 描述 | `Description` |
| `risk` | 风险 | `Risk` |
| `remediation` | 修复建议 | `Remediation.Recommendation.Text` |

状态 value 翻译：

| 原始值 | zh-CN | ja-JP |
| --- | --- | --- |
| `PASS` | 通过 | 合格 |
| `FAIL` | 失败 | 失敗 |
| `MANUAL` | 手动 | 手動 |
| `UNKNOWN` | 未知 | 不明 |

严重性 value 翻译：

| 原始值 | zh-CN | ja-JP |
| --- | --- | --- |
| `critical` | 严重 | 重大 |
| `high` | 高 | 高 |
| `medium` | 中 | 中 |
| `low` | 低 | 低 |
| `informational` | 信息 | 情報 |

## 2. 各报告文件会翻译哪些 value

报告 ZIP 包含：

```text
README.md
executive_report.md
scan_summary.json
findings.csv
findings.json
raw_findings.json
resources.csv
resources.json
```

### README.md

不会翻译业务 value。

| Value 字段 | 对应 label/含义 | 是否翻译 value | 说明 |
| --- | --- | --- | --- |
| `locale` | 语言 | 否 | 记录报告语言，例如 `zh-CN`、`ja-JP` |

### executive_report.md

| Value 字段 | 对应 label/含义 | 是否翻译 value | 说明 |
| --- | --- | --- | --- |
| `status_display` | 状态标签 | 是 | 例如 `FAIL` 显示为 `失败` / `失敗` |
| `severity_display` | 严重性标签 | 是 | 例如 `critical` 显示为 `严重` / `重大` |
| `check_title` | 检查项标题 | 是 | 来自 `CheckTitle` |
| `scan_id` | 扫描 ID | 否 | scan 的唯一标识 |
| `scan_name` | 扫描名称 | 否 | 用户填写或系统生成的扫描名称 |
| `provider` | 云提供商 | 否 | provider 类型，例如 `aws` |
| `provider_uid` | 云账号/订阅 UID | 否 | 云账号 ID 或订阅 ID |
| `generated_at` | 生成时间 | 否 | 报告生成时间 |
| `check_id` | 检查项 ID | 否 | 检查项机器 ID |
| `resource_uid` | 资源 UID | 否 | 云资源唯一标识 |

### findings.csv

| Value 字段 | 对应 label/含义 | 是否翻译 value | 说明 |
| --- | --- | --- | --- |
| `status_display` | 状态标签 | 是 | 例如 `FAIL` 显示为 `失败` / `失敗` |
| `severity_display` | 严重性标签 | 是 | 例如 `critical` 显示为 `严重` / `重大` |
| `check_title` | 检查项标题 | 是 | 来自 `CheckTitle` |
| `description` | 描述 | 是 | 来自 `Description` |
| `risk` | 风险 | 是 | 来自 `Risk` |
| `remediation` | 修复建议 | 是 | 来自 `Remediation.Recommendation.Text` |
| `uid` | 发现 UID | 否 | finding 的唯一标识 |
| `check_id` | 检查项 ID | 否 | 检查项机器 ID |
| `resource_uid` | 资源 UID | 否 | 云资源唯一标识 |
| `resource_name` | 资源名称 | 否 | 云资源名称 |
| `region` | 区域 | 否 | 云区域，例如 `eu-west-3` |
| `service` | 服务 | 否 | 云服务，例如 `drs`、`ec2` |
| `resource_type` | 资源类型 | 否 | 资源分类，例如 `Other` |

### findings.json

| Value 字段 | 对应 label/含义 | 是否翻译 value | 说明 |
| --- | --- | --- | --- |
| `status_display` | 状态标签 | 是 | 例如 `FAIL` 显示为 `失败` / `失敗` |
| `severity_display` | 严重性标签 | 是 | 例如 `critical` 显示为 `严重` / `重大` |
| `check_title` | 检查项标题 | 是 | 来自 `CheckTitle` |
| `description` | 描述 | 是 | 来自 `Description` |
| `risk` | 风险 | 是 | 来自 `Risk` |
| `remediation` | 修复建议 | 是 | 来自 `Remediation.Recommendation.Text` |
| `uid` | 发现 UID | 否 | finding 的唯一标识 |
| `check_id` | 检查项 ID | 否 | 检查项机器 ID |
| `resource_uid` | 资源 UID | 否 | 云资源唯一标识 |
| `resource_name` | 资源名称 | 否 | 云资源名称 |
| `region` | 区域 | 否 | 云区域，例如 `eu-west-3` |
| `service` | 服务 | 否 | 云服务，例如 `drs`、`ec2` |
| `resource_type` | 资源类型 | 否 | 资源分类，例如 `Other` |

### resources.csv

不会翻译业务 value。

| Value 字段 | 对应 label/含义 | 是否翻译 value | 说明 |
| --- | --- | --- | --- |
| `resource_uid` | 资源 UID | 否 | 云资源唯一标识 |
| `resource_name` | 资源名称 | 否 | 云资源名称 |
| `region` | 区域 | 否 | 云区域，例如 `eu-west-3` |
| `service` | 服务 | 否 | 云服务，例如 `drs`、`ec2` |
| `resource_type` | 资源类型 | 否 | 资源分类，例如 `Other` |

### resources.json

不会翻译业务 value。

| Value 字段 | 对应 label/含义 | 是否翻译 value | 说明 |
| --- | --- | --- | --- |
| `uid` | 资源 UID | 否 | 云资源唯一标识 |
| `name` | 资源名称 | 否 | 云资源名称 |
| `region` | 区域 | 否 | 云区域，例如 `eu-west-3` |
| `service` | 服务 | 否 | 云服务，例如 `drs`、`ec2` |
| `type` | 资源类型 | 否 | 资源分类，例如 `Other` |

### scan_summary.json

不会翻译业务 value。

| Value 字段 | 对应 label/含义 | 是否翻译 value | 说明 |
| --- | --- | --- | --- |
| `locale` | 语言 | 否 | 记录报告语言，例如 `zh-CN`、`ja-JP` |
| `generated_at` | 生成时间 | 否 | 报告生成时间 |
| `scan` | 扫描信息 | 否 | 包含扫描 ID、名称、状态、provider 等原始值 |
| `total_findings` | 发现总数 | 否 | 数值 |
| `status` | 状态统计 | 否 | 原始统计 key，例如 `PASS`、`FAIL` |
| `severity` | 严重性统计 | 否 | 原始统计 key，例如 `critical`、`high` |
| `resource_count` | 资源数量 | 否 | 数值 |

### raw_findings.json

不会翻译业务 value。

| Value 字段 | 对应 label/含义 | 是否翻译 value | 说明 |
| --- | --- | --- | --- |
| `uid` | 发现 UID | 否 | finding 的唯一标识 |
| `status` | 状态原始值 | 否 | 原始值，例如 `PASS`、`FAIL` |
| `severity` | 严重性原始值 | 否 | 原始值，例如 `critical`、`high` |
| `check_id` | 检查项 ID | 否 | 检查项机器 ID |
| `status_extended` | 状态详情 | 否 | 扫描产生的原始状态详情 |
| `check_metadata` | 检查项 metadata | 否 | 原始 metadata，不做本地化展示 |
| `raw_result` | 原始结果 | 否 | 原始扫描结果 JSON |

## 3. 明确不翻译的 value

以下 value 在所有报告文件中保持原值：

| Value 字段 | 对应 label/含义 | 说明 |
| --- | --- | --- |
| `uid` | 发现 UID | finding 的唯一标识 |
| `check_id` | 检查项 ID | 检查项机器 ID |
| `provider` | 云提供商 | provider 类型，例如 `aws` |
| `provider_uid` | 云账号/订阅 UID | 云账号 ID 或订阅 ID |
| `scan_id` | 扫描 ID | scan 的唯一标识 |
| `scan_name` | 扫描名称 | 用户填写或系统生成的扫描名称 |
| `generated_at` | 生成时间 | 报告生成时间 |
| `resource_uid` | 资源 UID | 云资源唯一标识 |
| `resource_name` | 资源名称 | 云资源名称 |
| `region` | 区域 | 云区域，例如 `eu-west-3` |
| `service` | 服务 | 云服务，例如 `drs`、`ec2` |
| `resource_type` | 资源类型 | 资源分类，例如 `Other` |
| `raw_result` | 原始结果 | 原始扫描结果 JSON |
| `Remediation.Code.CLI` | CLI 修复代码 | 命令保持原文 |
| `Remediation.Code.NativeIaC` | Native IaC 修复代码 | 代码保持原文 |
| `Remediation.Code.Other` | 其他修复代码 | 代码/说明保持原文 |
| `Remediation.Code.Terraform` | Terraform 修复代码 | 代码保持原文 |

## 4. 语言选择

- `Accept-Language: zh` 或 `zh-CN` 使用中文 value。
- `Accept-Language: ja` 或 `ja-JP` 使用日文 value。
- 其他语言回退英文。
- 某个 check 缺少本地化 metadata 时，回退英文 value，不应导出失败。
