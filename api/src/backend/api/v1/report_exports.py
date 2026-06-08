import csv
import io
import json
import zipfile
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path

from config.env import env

from api.models import Finding, Scan
from api.v1.serializer_utils.check_metadata_i18n import (
    get_localized_check_metadata,
    normalize_accept_language,
)

SUPPORTED_REPORT_LOCALES = {"en", "zh-CN", "ja-JP"}

REPORT_TEXT = {
    "en": {
        "readme_title": "Scan Report",
        "readme_body": "This report was generated from stored scan findings.",
        "executive_title": "Executive Report",
        "summary": "Summary",
        "scan": "Scan",
        "provider": "Provider",
        "generated_at": "Generated at",
        "total_findings": "Total findings",
        "status_breakdown": "Status breakdown",
        "severity_breakdown": "Severity breakdown",
        "top_findings": "Top findings",
        "no_findings": "No findings are available for this scan.",
        "status": {
            "PASS": "Passed",
            "FAIL": "Failed",
            "MANUAL": "Manual",
            "UNKNOWN": "Unknown",
        },
        "severity": {
            "critical": "Critical",
            "high": "High",
            "medium": "Medium",
            "low": "Low",
            "informational": "Informational",
        },
        "csv": {
            "uid": "Finding UID",
            "status": "Status",
            "status_display": "Status label",
            "severity": "Severity",
            "severity_display": "Severity label",
            "check_id": "Check ID",
            "check_title": "Check title",
            "description": "Description",
            "risk": "Risk",
            "remediation": "Remediation",
            "resource_uid": "Resource UID",
            "resource_name": "Resource name",
            "region": "Region",
            "service": "Service",
            "resource_type": "Resource type",
            "status_extended": "Status details",
        },
    },
    "zh-CN": {
        "readme_title": "扫描报告",
        "readme_body": "此报告基于已入库的扫描发现生成。",
        "executive_title": "执行报告",
        "summary": "摘要",
        "scan": "扫描",
        "provider": "云提供商",
        "generated_at": "生成时间",
        "total_findings": "发现总数",
        "status_breakdown": "状态分布",
        "severity_breakdown": "严重性分布",
        "top_findings": "主要发现",
        "no_findings": "此扫描没有可用发现。",
        "status": {
            "PASS": "通过",
            "FAIL": "失败",
            "MANUAL": "手动",
            "UNKNOWN": "未知",
        },
        "severity": {
            "critical": "严重",
            "high": "高",
            "medium": "中",
            "low": "低",
            "informational": "信息",
        },
        "csv": {
            "uid": "发现 UID",
            "status": "状态",
            "status_display": "状态标签",
            "severity": "严重性",
            "severity_display": "严重性标签",
            "check_id": "检查项 ID",
            "check_title": "检查项标题",
            "description": "描述",
            "risk": "风险",
            "remediation": "修复建议",
            "resource_uid": "资源 UID",
            "resource_name": "资源名称",
            "region": "区域",
            "service": "服务",
            "resource_type": "资源类型",
            "status_extended": "状态详情",
        },
    },
    "ja-JP": {
        "readme_title": "スキャンレポート",
        "readme_body": "このレポートは保存済みのスキャン検出結果から生成されました。",
        "executive_title": "エグゼクティブレポート",
        "summary": "概要",
        "scan": "スキャン",
        "provider": "クラウドプロバイダー",
        "generated_at": "生成日時",
        "total_findings": "検出結果数",
        "status_breakdown": "ステータス別内訳",
        "severity_breakdown": "重大度別内訳",
        "top_findings": "主な検出結果",
        "no_findings": "このスキャンには利用可能な検出結果がありません。",
        "status": {
            "PASS": "合格",
            "FAIL": "失敗",
            "MANUAL": "手動",
            "UNKNOWN": "不明",
        },
        "severity": {
            "critical": "重大",
            "high": "高",
            "medium": "中",
            "low": "低",
            "informational": "情報",
        },
        "csv": {
            "uid": "検出 UID",
            "status": "ステータス",
            "status_display": "ステータス表示",
            "severity": "重大度",
            "severity_display": "重大度表示",
            "check_id": "チェック ID",
            "check_title": "チェックタイトル",
            "description": "説明",
            "risk": "リスク",
            "remediation": "修復手順",
            "resource_uid": "リソース UID",
            "resource_name": "リソース名",
            "region": "リージョン",
            "service": "サービス",
            "resource_type": "リソースタイプ",
            "status_extended": "ステータス詳細",
        },
    },
}


def normalize_report_locale(accept_language: str | None) -> str:
    return normalize_accept_language(accept_language) or "en"


def localized_report_path(scan: Scan, locale: str) -> Path:
    output_root = env.str("DJANGO_TMP_OUTPUT_DIRECTORY", "/tmp/prowler_api_output")
    return (
        Path(output_root)
        / "localized-scan-reports"
        / str(scan.tenant_id)
        / str(scan.id)
        / f"{scan.id}-report.{locale}.zip"
    )


def get_or_create_localized_scan_report(
    scan: Scan, accept_language: str | None
) -> tuple[str | None, str]:
    locale = normalize_report_locale(accept_language)
    report_path = localized_report_path(scan, locale)

    if report_path.is_file():
        return str(report_path), locale

    findings_qs = Finding.all_objects.filter(
        tenant_id=scan.tenant_id,
        scan_id=scan.id,
    ).prefetch_related("resources")

    if not findings_qs.exists():
        if locale == "en" and scan.output_location:
            return scan.output_location, locale
        return None, locale

    report_path.parent.mkdir(parents=True, exist_ok=True)
    _write_scan_report_zip(scan, locale, report_path, list(findings_qs))

    if locale == "en" and not scan.output_location:
        Scan.all_objects.filter(id=scan.id).update(output_location=str(report_path))

    return str(report_path), locale


def _localized_check_metadata(finding: Finding, locale: str) -> dict:
    metadata = finding.check_metadata or {}
    if locale == "en":
        return metadata

    localized = get_localized_check_metadata(
        metadata.get("provider") or finding.scan.provider.provider,
        finding.check_id,
        locale,
    )
    if not localized:
        return metadata

    translated = metadata.copy()
    key_map = {
        "CheckTitle": "checktitle",
        "Description": "description",
        "Risk": "risk",
        "RelatedUrl": "relatedurl",
        "ServiceName": "servicename",
        "SubServiceName": "subservicename",
        "ResourceType": "resourcetype",
    }
    for source_key, target_key in key_map.items():
        if localized.get(source_key):
            translated[target_key] = localized[source_key]

    recommendation = localized.get("Remediation", {}).get("Recommendation", {})
    if recommendation.get("Text"):
        translated.setdefault("remediation", {}).setdefault("recommendation", {})[
            "text"
        ] = recommendation["Text"]
    if recommendation.get("Url"):
        translated.setdefault("remediation", {}).setdefault("recommendation", {})[
            "url"
        ] = recommendation["Url"]

    return translated


def _display(mapping: dict, value: str | None) -> str:
    if not value:
        return ""
    return mapping.get(value, mapping.get(value.lower(), value))


def _finding_resource_rows(finding: Finding) -> list[dict]:
    resources = list(finding.resources.all())
    if not resources:
        return [
            {
                "uid": "",
                "name": "",
                "region": "",
                "service": "",
                "type": "",
            }
        ]

    return [
        {
            "uid": resource.uid,
            "name": resource.name,
            "region": resource.region,
            "service": resource.service,
            "type": resource.type,
        }
        for resource in resources
    ]


def _build_report_rows(scan: Scan, locale: str, findings: list[Finding]) -> list[dict]:
    text = REPORT_TEXT[locale]
    rows = []

    for finding in findings:
        metadata = _localized_check_metadata(finding, locale)
        remediation = (
            metadata.get("remediation", {})
            .get("recommendation", {})
            .get("text", "")
        )
        resources = _finding_resource_rows(finding)

        for resource in resources:
            rows.append(
                {
                    "uid": finding.uid,
                    "status": finding.status,
                    "status_display": _display(text["status"], finding.status),
                    "severity": finding.severity,
                    "severity_display": _display(text["severity"], finding.severity),
                    "check_id": finding.check_id,
                    "check_title": metadata.get("checktitle", ""),
                    "description": metadata.get("description", ""),
                    "risk": metadata.get("risk", ""),
                    "remediation": remediation,
                    "resource_uid": resource["uid"],
                    "resource_name": resource["name"],
                    "region": resource["region"],
                    "service": resource["service"],
                    "resource_type": resource["type"],
                    "status_extended": finding.status_extended or "",
                }
            )

    return rows


def _build_raw_finding_rows(findings: list[Finding]) -> list[dict]:
    raw_rows = []
    for finding in findings:
        raw_rows.append(
            {
                "uid": finding.uid,
                "status": finding.status,
                "severity": finding.severity,
                "check_id": finding.check_id,
                "status_extended": finding.status_extended,
                "check_metadata": finding.check_metadata,
                "raw_result": finding.raw_result,
            }
        )
    return raw_rows


def _write_csv(rows: list[dict], locale: str) -> str:
    labels = REPORT_TEXT[locale]["csv"]
    if locale == "en":
        fieldnames = list(labels.keys())
    else:
        fieldnames = [
            "uid",
            "status_display",
            "severity_display",
            "check_id",
            "check_title",
            "description",
            "risk",
            "remediation",
            "resource_uid",
            "resource_name",
            "region",
            "service",
            "resource_type",
        ]
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writerow({field: labels[field] for field in fieldnames})
    for row in rows:
        writer.writerow({field: row.get(field, "") for field in fieldnames})
    return buffer.getvalue()


def _summary(scan: Scan, locale: str, rows: list[dict]) -> dict:
    unique_findings = {row["uid"] for row in rows}
    return {
        "locale": locale,
        "generated_at": datetime.now(UTC).isoformat(),
        "scan": {
            "id": str(scan.id),
            "name": scan.name,
            "state": scan.state,
            "provider": scan.provider.provider,
            "provider_uid": scan.provider.uid,
            "started_at": scan.started_at.isoformat() if scan.started_at else None,
            "completed_at": scan.completed_at.isoformat()
            if scan.completed_at
            else None,
        },
        "total_findings": len(unique_findings),
        "status": dict(Counter(row["status"] for row in rows)),
        "severity": dict(Counter(row["severity"] for row in rows)),
        "resource_count": len({row["resource_uid"] for row in rows if row["resource_uid"]}),
    }


def _markdown_report(scan: Scan, locale: str, rows: list[dict], summary: dict) -> str:
    text = REPORT_TEXT[locale]
    status_lines = "\n".join(
        f"- {_display(text['status'], key)}: {value}"
        for key, value in summary["status"].items()
    )
    severity_lines = "\n".join(
        f"- {_display(text['severity'], key)}: {value}"
        for key, value in summary["severity"].items()
    )
    top_rows = rows[:10]
    top_findings = "\n".join(
        f"- {row['check_id']} · {row['check_title']} · {row['severity_display']} · {row['resource_uid']}"
        for row in top_rows
    )

    if not top_findings:
        top_findings = text["no_findings"]

    return "\n".join(
        [
            f"# {text['executive_title']}",
            "",
            f"## {text['summary']}",
            "",
            f"- {text['scan']}: {scan.name or scan.id}",
            f"- {text['provider']}: {scan.provider.provider} / {scan.provider.uid}",
            f"- {text['generated_at']}: {summary['generated_at']}",
            f"- {text['total_findings']}: {summary['total_findings']}",
            "",
            f"## {text['status_breakdown']}",
            "",
            status_lines,
            "",
            f"## {text['severity_breakdown']}",
            "",
            severity_lines,
            "",
            f"## {text['top_findings']}",
            "",
            top_findings,
            "",
        ]
    )


def _write_scan_report_zip(
    scan: Scan, locale: str, report_path: Path, findings: list[Finding]
) -> None:
    rows = _build_report_rows(scan, locale, findings)
    summary = _summary(scan, locale, rows)
    resources = {
        row["resource_uid"]: {
            "uid": row["resource_uid"],
            "name": row["resource_name"],
            "region": row["region"],
            "service": row["service"],
            "type": row["resource_type"],
        }
        for row in rows
        if row["resource_uid"]
    }
    readme = (
        f"# {REPORT_TEXT[locale]['readme_title']}\n\n"
        f"{REPORT_TEXT[locale]['readme_body']}\n\n"
        f"Locale: {locale}\n"
    )

    with zipfile.ZipFile(report_path, "w", zipfile.ZIP_DEFLATED) as report_zip:
        report_zip.writestr("README.md", readme)
        report_zip.writestr("executive_report.md", _markdown_report(scan, locale, rows, summary))
        report_zip.writestr(
            "scan_summary.json",
            json.dumps(summary, ensure_ascii=False, indent=2),
        )
        report_zip.writestr("findings.csv", _write_csv(rows, locale))
        report_zip.writestr(
            "findings.json",
            json.dumps(_display_rows(rows, locale), ensure_ascii=False, indent=2, default=str),
        )
        report_zip.writestr(
            "raw_findings.json",
            json.dumps(
                _build_raw_finding_rows(findings),
                ensure_ascii=False,
                indent=2,
                default=str,
            ),
        )
        report_zip.writestr("resources.csv", _write_resources_csv(resources, locale))
        report_zip.writestr(
            "resources.json",
            json.dumps(list(resources.values()), ensure_ascii=False, indent=2),
        )


def _write_resources_csv(resources: dict, locale: str) -> str:
    labels = REPORT_TEXT[locale]["csv"]
    fieldnames = ["resource_uid", "resource_name", "region", "service", "resource_type"]
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writerow({field: labels[field] for field in fieldnames})
    for resource in resources.values():
        writer.writerow(
            {
                "resource_uid": resource["uid"],
                "resource_name": resource["name"],
                "region": resource["region"],
                "service": resource["service"],
                "resource_type": resource["type"],
            }
        )
    return buffer.getvalue()


def _display_rows(rows: list[dict], locale: str) -> list[dict]:
    if locale == "en":
        return rows

    display_fields = [
        "uid",
        "status_display",
        "severity_display",
        "check_id",
        "check_title",
        "description",
        "risk",
        "remediation",
        "resource_uid",
        "resource_name",
        "region",
        "service",
        "resource_type",
    ]
    return [{field: row.get(field, "") for field in display_fields} for row in rows]
