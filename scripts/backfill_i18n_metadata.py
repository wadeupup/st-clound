#!/usr/bin/env python3
"""Backfill missing zh-CN and ja-JP check metadata files.

This script intentionally does not overwrite existing localized metadata. It
keeps raw identifiers, URLs, CLI snippets, code remediation, and provider values
unchanged, while localizing human-facing text fields with a deterministic
security glossary. The output is a reviewable first pass for providers that have
no localized metadata yet.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PROVIDERS_DIR = ROOT / "prowler" / "providers"

TEXT_FIELDS = ("CheckTitle", "Description", "Risk")


COMMON_REPLACEMENTS_ZH = {
    "Customer-Managed Encryption Key": "客户管理的加密密钥",
    "Customer-Managed Keys": "客户管理密钥",
    "Customer Managed Key": "客户管理密钥",
    "Key Management Service": "密钥管理服务",
    "Cloud Key Management Service": "Cloud Key Management Service",
    "Cloud KMS": "Cloud KMS",
    "Google Cloud": "Google Cloud",
    "Microsoft 365": "Microsoft 365",
    "Kubernetes API server": "Kubernetes API 服务器",
    "API server": "API 服务器",
    "Cloud Audit Logs": "Cloud Audit Logs",
    "Admin Activity audit logs": "管理员活动审计日志",
    "Data Access audit logs": "数据访问审计日志",
    "Compute Engine": "Compute Engine",
    "Cloud Storage": "Cloud Storage",
    "Cloud SQL": "Cloud SQL",
    "SQL instance": "SQL 实例",
    "log metric filter": "日志指标过滤器",
    "alerting policies": "告警策略",
    "monitoring alert policy": "监控告警策略",
    "security analysis": "安全分析",
    "compliance auditing": "合规审计",
    "configuration changes": "配置变更",
    "audit configuration changes": "审计配置变更",
    "bucket permission changes": "存储桶权限变更",
    "VPC firewall rule changes": "VPC 防火墙规则变更",
    "VPC network changes": "VPC 网络变更",
    "project ownership changes": "项目所有权变更",
    "custom role changes": "自定义角色变更",
    "route changes": "路由变更",
    "Persistent Disks": "永久性磁盘",
    "data encryption key": "数据加密密钥",
    "key encryption key": "密钥加密密钥",
    "encryption key": "加密密钥",
    "encrypted": "已加密",
    "encryption": "加密",
    "decryption": "解密",
    "TLS verification": "TLS 验证",
    "certificate authority": "证书颁发机构",
    "man-in-the-middle attacks": "中间人攻击",
    "unauthorized access": "未授权访问",
    "security vulnerabilities": "安全漏洞",
    "authorization mode": "授权模式",
    "AlwaysAllow": "AlwaysAllow",
    "RBAC": "RBAC",
    "production clusters": "生产集群",
    "service account": "服务账号",
    "anonymous requests": "匿名请求",
    "audit log": "审计日志",
    "security context": "安全上下文",
    "Node Restriction": "Node Restriction",
    "container": "容器",
    "repository": "代码库",
    "default branch": "默认分支",
    "branch protection": "分支保护",
    "signed commits": "签名提交",
    "status checks": "状态检查",
    "CODEOWNERS": "CODEOWNERS",
    "secret scanning": "密钥扫描",
    "dependency scanning": "依赖扫描",
    "multi-factor authentication": "多因素认证",
    "MFA": "MFA",
    "organization": "组织",
    "members": "成员",
    "public access": "公共访问",
    "publicly accessible": "可公开访问",
    "administrative privileges": "管理权限",
    "root access key": "根访问密钥",
    "access key": "访问密钥",
    "password policy": "密码策略",
    "minimum length": "最小长度",
    "uppercase": "大写字母",
    "lowercase": "小写字母",
    "number": "数字",
    "symbol": "符号",
    "password reuse prevention": "密码重复使用防护",
    "maximum password age": "最长密码有效期",
    "login attempts": "登录尝试次数",
    "database": "数据库",
    "RDS instance": "RDS 实例",
    "RDS cluster": "RDS 集群",
    "snapshots": "快照",
    "deletion protection": "删除保护",
    "enhanced monitoring": "增强监控",
    "CloudWatch Logs": "CloudWatch Logs",
    "event subscription": "事件订阅",
    "backups": "备份",
    "backup": "备份",
    "network": "网络",
    "security group": "安全组",
    "ingress": "入站流量",
    "internet": "互联网",
    "MongoDB Atlas": "MongoDB Atlas",
    "Oracle Cloud": "Oracle Cloud",
    "Alibaba Cloud": "Alibaba Cloud",
    "NHN Cloud": "NHN Cloud",
}

COMMON_REPLACEMENTS_JA = {
    "Customer-Managed Encryption Key": "顧客管理の暗号化キー",
    "Customer-Managed Keys": "顧客管理キー",
    "Customer Managed Key": "顧客管理キー",
    "Key Management Service": "キー管理サービス",
    "Cloud Key Management Service": "Cloud Key Management Service",
    "Cloud KMS": "Cloud KMS",
    "Google Cloud": "Google Cloud",
    "Microsoft 365": "Microsoft 365",
    "Kubernetes API server": "Kubernetes API サーバー",
    "API server": "API サーバー",
    "Cloud Audit Logs": "Cloud Audit Logs",
    "Admin Activity audit logs": "管理者アクティビティ監査ログ",
    "Data Access audit logs": "データアクセス監査ログ",
    "Compute Engine": "Compute Engine",
    "Cloud Storage": "Cloud Storage",
    "Cloud SQL": "Cloud SQL",
    "SQL instance": "SQL インスタンス",
    "log metric filter": "ログ指標フィルター",
    "alerting policies": "アラートポリシー",
    "monitoring alert policy": "監視アラートポリシー",
    "security analysis": "セキュリティ分析",
    "compliance auditing": "コンプライアンス監査",
    "configuration changes": "構成変更",
    "audit configuration changes": "監査構成の変更",
    "bucket permission changes": "バケット権限の変更",
    "VPC firewall rule changes": "VPC ファイアウォールルールの変更",
    "VPC network changes": "VPC ネットワークの変更",
    "project ownership changes": "プロジェクト所有権の変更",
    "custom role changes": "カスタムロールの変更",
    "route changes": "ルート変更",
    "Persistent Disks": "永続ディスク",
    "data encryption key": "データ暗号化キー",
    "key encryption key": "キー暗号化キー",
    "encryption key": "暗号化キー",
    "encrypted": "暗号化済み",
    "encryption": "暗号化",
    "decryption": "復号",
    "TLS verification": "TLS 検証",
    "certificate authority": "認証局",
    "man-in-the-middle attacks": "中間者攻撃",
    "unauthorized access": "不正アクセス",
    "security vulnerabilities": "セキュリティ脆弱性",
    "authorization mode": "認可モード",
    "AlwaysAllow": "AlwaysAllow",
    "RBAC": "RBAC",
    "production clusters": "本番クラスター",
    "service account": "サービスアカウント",
    "anonymous requests": "匿名リクエスト",
    "audit log": "監査ログ",
    "security context": "セキュリティコンテキスト",
    "Node Restriction": "Node Restriction",
    "container": "コンテナ",
    "repository": "リポジトリ",
    "default branch": "デフォルトブランチ",
    "branch protection": "ブランチ保護",
    "signed commits": "署名付きコミット",
    "status checks": "ステータスチェック",
    "CODEOWNERS": "CODEOWNERS",
    "secret scanning": "シークレットスキャン",
    "dependency scanning": "依存関係スキャン",
    "multi-factor authentication": "多要素認証",
    "MFA": "MFA",
    "organization": "組織",
    "members": "メンバー",
    "public access": "パブリックアクセス",
    "publicly accessible": "パブリックアクセス可能",
    "administrative privileges": "管理者権限",
    "root access key": "ルートアクセスキー",
    "access key": "アクセスキー",
    "password policy": "パスワードポリシー",
    "minimum length": "最小長",
    "uppercase": "大文字",
    "lowercase": "小文字",
    "number": "数字",
    "symbol": "記号",
    "password reuse prevention": "パスワード再利用防止",
    "maximum password age": "パスワード最大有効期間",
    "login attempts": "ログイン試行回数",
    "database": "データベース",
    "RDS instance": "RDS インスタンス",
    "RDS cluster": "RDS クラスター",
    "snapshots": "スナップショット",
    "deletion protection": "削除保護",
    "enhanced monitoring": "拡張モニタリング",
    "CloudWatch Logs": "CloudWatch Logs",
    "event subscription": "イベントサブスクリプション",
    "backups": "バックアップ",
    "backup": "バックアップ",
    "network": "ネットワーク",
    "security group": "セキュリティグループ",
    "ingress": "受信トラフィック",
    "internet": "インターネット",
    "MongoDB Atlas": "MongoDB Atlas",
    "Oracle Cloud": "Oracle Cloud",
    "Alibaba Cloud": "Alibaba Cloud",
    "NHN Cloud": "NHN Cloud",
}

PHRASE_REPLACEMENTS_ZH = [
    (r"^Ensure that (.+)$", r"确保\1"),
    (r"^Ensure That (.+)$", r"确保\1"),
    (r"^Ensure (.+)$", r"确保\1"),
    (r"^Check if (.+)$", r"检查\1"),
    (r"^This check ensures that (.+)$", r"此检查确保\1"),
    (r"^This check verifies that (.+)$", r"此检查验证\1"),
    (r"^This check checks that (.+)$", r"此检查确认\1"),
    (r"^Without (.+)$", r"如果没有\1"),
    (r"^By using (.+)$", r"通过使用\1"),
    (r" is enabled", "已启用"),
    (r" is disabled", "已禁用"),
    (r" are enabled", "已启用"),
    (r" are disabled", "已禁用"),
    (r" is configured", "已配置"),
    (r" is not configured", "未配置"),
    (r" is set", "已设置"),
    (r" is not set", "未设置"),
    (r" exists", "存在"),
    (r" do not exist", "不存在"),
    (r" should not be used", "不应使用"),
    (r" should be enabled", "应启用"),
    (r" should be disabled", "应禁用"),
    (r" can affect ", "可能影响"),
    (r" helps detect ", "有助于检测"),
    (r" increasing the risk of ", "会增加以下风险："),
]

PHRASE_REPLACEMENTS_JA = [
    (r"^Ensure that (.+)$", r"\1を確認します"),
    (r"^Ensure That (.+)$", r"\1を確認します"),
    (r"^Ensure (.+)$", r"\1を確認します"),
    (r"^Check if (.+)$", r"\1をチェックします"),
    (r"^This check ensures that (.+)$", r"このチェックは\1を確認します"),
    (r"^This check verifies that (.+)$", r"このチェックは\1を検証します"),
    (r"^This check checks that (.+)$", r"このチェックは\1を確認します"),
    (r"^Without (.+)$", r"\1がない場合、"),
    (r"^By using (.+)$", r"\1を使用することで、"),
    (r" is enabled", "が有効です"),
    (r" is disabled", "が無効です"),
    (r" are enabled", "が有効です"),
    (r" are disabled", "が無効です"),
    (r" is configured", "が構成されています"),
    (r" is not configured", "が構成されていません"),
    (r" is set", "が設定されています"),
    (r" is not set", "が設定されていません"),
    (r" exists", "が存在します"),
    (r" do not exist", "が存在しません"),
    (r" should not be used", "は使用しないでください"),
    (r" should be enabled", "を有効にしてください"),
    (r" should be disabled", "を無効にしてください"),
    (r" can affect ", "は影響を与える可能性があります: "),
    (r" helps detect ", "の検出に役立ちます: "),
    (r" increasing the risk of ", "次のリスクを高めます: "),
]


def replace_terms(text: str, replacements: dict[str, str]) -> str:
    for source, target in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
        text = text.replace(source, target)
    return text


def apply_phrases(text: str, replacements: list[tuple[str, str]]) -> str:
    for source, target in replacements:
        text = re.sub(source, target, text)
    return text


def localize_text(text: str, locale: str) -> str:
    if not text:
        return text

    if locale == "zh-CN":
        text = replace_terms(text, COMMON_REPLACEMENTS_ZH)
        text = apply_phrases(text, PHRASE_REPLACEMENTS_ZH)
        return text

    text = replace_terms(text, COMMON_REPLACEMENTS_JA)
    text = apply_phrases(text, PHRASE_REPLACEMENTS_JA)
    return text


def localize_metadata(metadata: dict[str, Any], locale: str) -> dict[str, Any]:
    localized = json.loads(json.dumps(metadata))
    for field in TEXT_FIELDS:
        localized[field] = localize_text(localized.get(field, ""), locale)

    recommendation = localized.get("Remediation", {}).get("Recommendation", {})
    if "Text" in recommendation:
        recommendation["Text"] = localize_text(recommendation.get("Text", ""), locale)

    return localized


def localized_path(metadata_path: Path, locale: str) -> Path:
    check_name = metadata_path.name.removesuffix(".metadata.json")
    return metadata_path.with_name(f"{check_name}.metadata.{locale}.json")


def main() -> None:
    created = {"zh-CN": 0, "ja-JP": 0}
    for metadata_path in PROVIDERS_DIR.rglob("*.metadata.json"):
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        for locale in created:
            output_path = localized_path(metadata_path, locale)
            if output_path.exists():
                continue

            output_path.write_text(
                json.dumps(
                    localize_metadata(metadata, locale),
                    ensure_ascii=False,
                    indent=2,
                )
                + "\n",
                encoding="utf-8",
            )
            created[locale] += 1

    print(created)


if __name__ == "__main__":
    main()
