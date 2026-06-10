# Metadata JSON 字段说明

本文档说明 Prowler check 的 `metadata.json` 中有哪些字段，以及每个字段代表什么。当前先整理 AWS 和 Azure。

## AWS metadata.json 字段

### 顶层字段

| 字段 | Label/含义 |
| --- | --- |
| `Provider` | 云提供商 |
| `CheckID` | 检查项 ID |
| `CheckTitle` | 检查项标题 |
| `CheckType` | 检查类型 |
| `ServiceName` | 服务名称 |
| `SubServiceName` | 子服务名称 |
| `ResourceIdTemplate` | 资源 ID 模板 |
| `Severity` | 严重性 |
| `ResourceType` | 资源类型 |
| `ResourceGroup` | 资源分组 |
| `Description` | 检查项描述 |
| `Risk` | 风险说明 |
| `RelatedUrl` | 相关参考链接 |
| `Remediation` | 修复信息 |
| `Categories` | 分类 |
| `DependsOn` | 依赖检查项 |
| `RelatedTo` | 相关检查项 |
| `Notes` | 备注 |
| `AdditionalURLs` | 额外参考链接 |
| `CheckAliases` | 检查项别名 |
| `Tags` | 标签 |

### Remediation 字段

| 字段 | Label/含义 |
| --- | --- |
| `Remediation.Code` | 修复代码 |
| `Remediation.Recommendation` | 修复建议 |

### Remediation.Recommendation 字段

| 字段 | Label/含义 |
| --- | --- |
| `Remediation.Recommendation.Text` | 修复建议正文 |
| `Remediation.Recommendation.Url` | 修复建议链接 |

### Remediation.Code 字段

| 字段 | Label/含义 |
| --- | --- |
| `Remediation.Code.CLI` | CLI 修复命令 |
| `Remediation.Code.NativeIaC` | 原生 IaC 修复代码 |
| `Remediation.Code.Other` | 其他修复代码或说明 |
| `Remediation.Code.Terraform` | Terraform 修复代码 |

## Azure metadata.json 字段

### 顶层字段

| 字段 | Label/含义 |
| --- | --- |
| `Provider` | 云提供商 |
| `CheckID` | 检查项 ID |
| `CheckTitle` | 检查项标题 |
| `CheckType` | 检查类型 |
| `ServiceName` | 服务名称 |
| `SubServiceName` | 子服务名称 |
| `ResourceIdTemplate` | 资源 ID 模板 |
| `Severity` | 严重性 |
| `ResourceType` | 资源类型 |
| `ResourceGroup` | 资源分组 |
| `Description` | 检查项描述 |
| `Risk` | 风险说明 |
| `RelatedUrl` | 相关参考链接 |
| `Remediation` | 修复信息 |
| `Categories` | 分类 |
| `DependsOn` | 依赖检查项 |
| `RelatedTo` | 相关检查项 |
| `Notes` | 备注 |
| `AdditionalURLs` | 额外参考链接 |

### Remediation 字段

| 字段 | Label/含义 |
| --- | --- |
| `Remediation.Code` | 修复代码 |
| `Remediation.Recommendation` | 修复建议 |

### Remediation.Recommendation 字段

| 字段 | Label/含义 |
| --- | --- |
| `Remediation.Recommendation.Text` | 修复建议正文 |
| `Remediation.Recommendation.Url` | 修复建议链接 |

### Remediation.Code 字段

| 字段 | Label/含义 |
| --- | --- |
| `Remediation.Code.Arm` | ARM 模板修复代码 |
| `Remediation.Code.CLI` | CLI 修复命令 |
| `Remediation.Code.NativeIaC` | 原生 IaC 修复代码 |
| `Remediation.Code.Other` | 其他修复代码或说明 |
| `Remediation.Code.Terraform` | Terraform 修复代码 |

## AWS 和 Azure 共同字段

### 共同顶层字段

```text
Provider
CheckID
CheckTitle
CheckType
ServiceName
SubServiceName
ResourceIdTemplate
Severity
ResourceType
ResourceGroup
Description
Risk
RelatedUrl
Remediation
Categories
DependsOn
RelatedTo
Notes
AdditionalURLs
```

### 共同 Remediation 字段

```text
Remediation.Code
Remediation.Recommendation
Remediation.Recommendation.Text
Remediation.Recommendation.Url
Remediation.Code.CLI
Remediation.Code.NativeIaC
Remediation.Code.Other
Remediation.Code.Terraform
```

## AWS 和 Azure 不同字段

### AWS 有、Azure 没有

```text
CheckAliases
Tags
```

### Azure 有、AWS 没有

```text
Remediation.Code.Arm
```

## 和报告翻译的关系

metadata.json 中字段很多，但当前本地化报告实际会翻译的 value 只有：

```text
CheckTitle
Description
Risk
Remediation.Recommendation.Text
```

其他 ID、枚举、资源、区域、服务、代码类字段通常保持原值。
