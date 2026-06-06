# ST CSPM

前后端主分支在master
后端主要文件夹在prowler
前端主要文件夹在ui

# 目标功能
1. CSPM（Cloud Security Posture Management）云配置检查
•	检测范围：AWS / Azure / GCP 的核心服务（S3, IAM, EC2, Security Group, RDS, CloudTrail 等）。
•	规则库：常见误配置（公开存储桶、弱口令策略、过度权限、未开启加密/日志等）。
________________________________________
2. IaC Security（インフラコード診断）
•	检测 Terraform / CloudFormation / Kubernetes YAML 配置问题。
•	工具：开源 Checkov / tfsec 可直接集成。
•	价值：日本客户常见场景是 DevOps 推进过程中，需要事前检测配置风险。
________________________________________
3. 镜像 / 依赖漏洞扫描（Container & Dependency Scan）
•	Docker 镜像漏洞扫描：如基础镜像是否含 CVE。
•	依赖库漏洞扫描（SCA）：NPM, pip, Maven 依赖库。
•	工具：开源 Trivy 足够。
•	价值：软件开发企业在审计/客户要求时，必须有“脆弱性診断レポート”。
________________________________________
4. Secrets / Credential 检测
•	扫描代码库、配置文件 是否包含 API Key、密码、认证信息。
•	工具：Gitleaks / Trufflehog。
•	价值：非常贴合“日本客户安全チェックリスト”（ソースコード内の秘密情報漏洩確認）。
________________________________________
5. 报告与可视化
•	管理者报告（PDF/日文）：包括检测到的风险、严重度（高/中/低）、对应的対策案。
•	ダッシュボード（Web 界面）：基本的风险一览表、趋势图。
•	必须支持 日本語 UI / レポート，否则客户接受度低。


## 已开发功能


## 未开发功能
1. CSPM（Cloud Security Posture Management）云配置检查
2. IaC Security（インフラコード診断）
3. 镜像 / 依赖漏洞扫描（Container & Dependency Scan）
4. Secrets / Credential 检测
5. 报告与可视化

# 开发手顺v1.0
1. /prowler/providers 文件夹下存放的是云配置检查项目，已翻译为中日英

## 项目原理
prowler通过云厂商 API 获取资源配置，然后用内置或自定义规则判断是否符合安全最佳实践。
CLI / API 启动
  ↓
Provider 初始化认证上下文
  ↓
Service 调用云厂商 API 收集资源
  ↓
Check 对资源配置进行规则判断
  ↓
生成 Finding / Report
  ↓
输出 JSON、CSV、HTML、Dashboard 等
## 项目架构
prowler/
├── prowler/           # Prowler SDK 主源码（CLI、云厂商 Provider、服务、检查项、合规项、配置等）
├── api/               # API 服务端及相关代码
├── dashboard/         # 从 CLI 输出中生成的本地 Dashboard
├── ui/                # Web UI 组件
├── util/              # 工具脚本与辅助功能
├── tests/             # Prowler SDK 测试套件
├── docs/              # 文档，包括本指南
├── examples/          # 各云厂商输出格式及脚本示例
├── permissions/       # 权限相关文件与策略
├── contrib/           # 社区贡献的脚本或模块
├── kubernetes/        # Kubernetes 部署文件
├── .github/           # GitHub 相关文件（工作流、Issue 模板等）
├── pyproject.toml     # Python 项目配置（Poetry）
├── poetry.lock        # Poetry 锁定依赖文件
├── README.md          # 项目概览与快速开始
├── Makefile           # 常用开发命令
├── Dockerfile         # SDK Docker 容器配置
├── docker-compose.yml # Prowler App Docker Compose 配置
└── ...                # 其他辅助文件


## providers

prowler/providers/<provider_name>/lib/regions/<provider_name>_regions.py 






# changelog
- 2026.5.8
完成初版提交