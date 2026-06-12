import copy
import io
import re
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from lxml import etree


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}

REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
CONTENT_TYPES_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
FOOTER_REL_TYPE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer"
)
FOOTER_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"
)
SEVERITY_ORDER = ["critical", "high", "medium", "low", "informational"]
SEVERITY_LABELS = {
    "critical": "Critical",
    "high": "High",
    "medium": "Medium",
    "low": "Low",
    "informational": "Informational",
}
SEVERITY_BY_LABEL = {label: key for key, label in SEVERITY_LABELS.items()}
SEVERITY_COLORS = {
    "critical": "990000",
    "high": "C65911",
    "medium": "9C6500",
    "low": "375E1D",
    "informational": "1F4E79",
}
BODY_WIDTH_DXA = 9360
STANDARD_BLOCK_WIDTH_DXA = int(BODY_WIDTH_DXA * 0.8)
SUPPORTED_DOCX_LOCALES = {"en", "zh-CN", "ja-JP"}
DOCX_FONT_BY_LOCALE = {
    "en": "Century",
    "zh-CN": "宋体",
    "ja-JP": "ＭＳ 明朝",
}
DOCX_SIZE_BIG_TITLE = 48
DOCX_SIZE_HEADING_1 = 36
DOCX_SIZE_HEADING_2 = 28
DOCX_SIZE_HEADING_3 = 24
DOCX_SIZE_BODY = 21
DOCX_SIZE_TOC_LEVEL_1 = 24
DOCX_SIZE_TOC_LEVEL_2 = 20
DOCX_COVER_TITLES = {
    "Executive_Report",
    "Executive Report",
    "Findings Report",
    "执行报告",
    "发现详情报告",
    "检测结果详情报告",
    "エグゼクティブレポート",
    "検出結果詳細レポート",
}
DOCX_COVER_ASSESSMENT_PREFIXES = ("Assessment Name:", "评估名称:", "評価名:")
DOCX_COVER_STANDARD_PREFIXES = (
    "Cloud Provider:",
    "Account ID:",
    "云提供商:",
    "账号 ID:",
    "クラウドプロバイダー:",
    "アカウント ID:",
)
DOCX_COVER_DATE_PREFIXES = ("Assessment Date:", "评估日期:", "評価日:")

STATUS_EXTENDED_TRANSLATIONS = {
    "zh-CN": {
        "AWS Organizations is not in-use for this AWS Account.": "此 AWS 账号未使用 AWS Organizations。",
        "No CloudTrail trails enabled with logging were found.": "未发现已启用日志记录的 CloudTrail trail。",
        "No CloudTrail trails enabled and logging management events were found.": "未发现已启用的 CloudTrail trail，也未发现管理事件日志记录。",
        "No CloudTrail trails have a data event to record all S3 object-level API operations.": "没有 CloudTrail trail 配置用于记录所有 S3 对象级 API 操作的数据事件。",
        "No CloudWatch log groups found with metric filters or alarms associated.": "未发现关联指标筛选器或告警的 CloudWatch 日志组。",
        "SECURITY, BILLING and OPERATIONS contacts not found or they are not different between each other and between ROOT contact.": "未找到 SECURITY、BILLING 和 OPERATIONS 联系人，或这些联系人彼此之间以及与 ROOT 联系人并不不同。",
        "No Backup Vault exist.": "不存在 Backup Vault。",
        "No SAML Providers found.": "未发现 SAML Provider。",
        "No SSM Incidents replication set exists.": "不存在 SSM Incidents 复制集。",
        "Amazon Web Services Premium Support Plan isn't subscribed.": "未订阅 Amazon Web Services Premium Support Plan。",
        "VPCs found only in one region.": "仅在一个区域中发现 VPC。",
        "Password expiration is not set.": "未设置密码过期时间。",
    },
    "ja-JP": {
        "AWS Organizations is not in-use for this AWS Account.": "この AWS アカウントでは AWS Organizations が使用されていません。",
        "No CloudTrail trails enabled with logging were found.": "ログ記録が有効な CloudTrail trail が見つかりません。",
        "No CloudTrail trails enabled and logging management events were found.": "有効な CloudTrail trail、および管理イベントのログ記録が見つかりません。",
        "No CloudTrail trails have a data event to record all S3 object-level API operations.": "すべての S3 オブジェクトレベル API 操作を記録するデータイベントが CloudTrail trail に設定されていません。",
        "No CloudWatch log groups found with metric filters or alarms associated.": "メトリクスフィルターまたはアラームに関連付けられた CloudWatch ロググループが見つかりません。",
        "SECURITY, BILLING and OPERATIONS contacts not found or they are not different between each other and between ROOT contact.": "SECURITY、BILLING、OPERATIONS の連絡先が見つからないか、相互に、または ROOT 連絡先と異なっていません。",
        "No Backup Vault exist.": "Backup Vault が存在しません。",
        "No SAML Providers found.": "SAML Provider が見つかりません。",
        "No SSM Incidents replication set exists.": "SSM Incidents レプリケーションセットが存在しません。",
        "Amazon Web Services Premium Support Plan isn't subscribed.": "Amazon Web Services Premium Support Plan が契約されていません。",
        "VPCs found only in one region.": "VPC が 1 つのリージョンでのみ見つかりました。",
        "Password expiration is not set.": "パスワードの有効期限が設定されていません。",
    },
}


@dataclass(frozen=True)
class ReportDocxText:
    severity: dict[str, str]
    labels: dict[str, str]
    fallback: dict[str, str]
    recommendations: list[str]


REPORT_DOCX_TEXT = {
    "en": ReportDocxText(
        severity=SEVERITY_LABELS,
        labels={
            "account_id": "Account ID",
            "affected_assets": "Affected Assets",
            "affected_resources": "Affected Resources",
            "assessment_date": "Assessment Date",
            "assessment_name": "Assessment Name",
            "assessment_scope": "Assessment Scope",
            "category": "Category",
            "check_id": "Check ID",
            "check_title": "Check Title",
            "cloud_provider": "Cloud Provider",
            "count": "Count",
            "current_status": "Current status",
            "description": "Description",
            "field": "Field",
            "finding": "Finding",
            "finding_id": "Finding ID",
            "finding_overview": "Finding Overview",
            "findings": "Findings",
            "item": "Item",
            "open": "Open",
            "overview": "Overview",
            "priority": "Priority",
            "region": "Region",
            "resource_count": "Resource Count",
            "resource_name": "Resource Name",
            "resource_type": "Resource Type",
            "risk": "Risk",
            "executive_summary": "Executive Summary",
            "remediation_guidance": "Remediation Guidance",
            "references": "References",
            "service": "Service",
            "severity": "Severity",
            "status": "Status",
            "value": "Value",
        },
        fallback={
            "assessment_name": "Cloud Security Assessment",
            "assessment_scope": "{provider} Cloud Security Assessment",
            "global": "global",
            "no_external_reference": "No external reference is available in scan data.",
            "no_findings": "No findings",
            "no_findings_available": "No failed findings are available in the scan data.",
            "no_findings_severity": "No findings in this severity level.",
            "no_narrative": "No narrative details are available in the scan data.",
            "no_resource": "No resource",
            "none": "None",
            "security_finding": "security finding",
            "uncategorized": "Uncategorized",
            "unknown": "Unknown",
        },
        recommendations=[
            "Remediate the highest-severity failed findings first.",
            "Prioritize logging, identity, and data protection controls.",
            "Review privileged access and exposed resources.",
            "Track medium-severity findings through a short-term remediation plan.",
            "Review recurring services and categories with repeated failed findings.",
            "Use scan results to drive alerting and control validation.",
            "Adopt continuous CSPM monitoring and periodic access reviews.",
            "Integrate report generation into recurring security operations.",
            "Route high-priority findings into the incident response workflow.",
            "Use trend and compliance modules once reliable historical and compliance data are available.",
        ],
    ),
    "zh-CN": ReportDocxText(
        severity={
            "critical": "严重",
            "high": "高",
            "medium": "中",
            "low": "低",
            "informational": "信息",
        },
        labels={
            "account_id": "账号 ID",
            "affected_assets": "受影响资产",
            "affected_resources": "受影响资源",
            "assessment_date": "评估日期",
            "assessment_name": "评估名称",
            "assessment_scope": "评估范围",
            "category": "类别",
            "check_id": "检查项 ID",
            "check_title": "检查项标题",
            "cloud_provider": "云提供商",
            "count": "数量",
            "current_status": "当前状态",
            "description": "描述",
            "field": "字段",
            "finding": "检测结果",
            "finding_id": "检测结果 ID",
            "finding_overview": "检测结果概览",
            "findings": "检测结果数",
            "item": "项目",
            "open": "未关闭",
            "overview": "概览",
            "priority": "优先级",
            "region": "区域",
            "resource_count": "资源数量",
            "resource_name": "资源名称",
            "resource_type": "资源类型",
            "risk": "风险",
            "executive_summary": "执行摘要",
            "remediation_guidance": "修复指导",
            "references": "参考资料",
            "service": "服务",
            "severity": "严重性",
            "status": "状态",
            "value": "值",
        },
        fallback={
            "assessment_name": "云安全评估",
            "assessment_scope": "{provider} 云安全评估",
            "global": "全局",
            "no_external_reference": "扫描数据中没有可用的外部参考链接。",
            "no_findings": "无检测结果",
            "no_findings_available": "扫描数据中没有失败的检测结果。",
            "no_findings_severity": "此严重等级下没有检测结果。",
            "no_narrative": "扫描数据中没有可用的文字详情。",
            "no_resource": "无资源",
            "none": "无",
            "security_finding": "安全检测结果",
            "uncategorized": "未分类",
            "unknown": "未知",
        },
        recommendations=[
            "优先修复最高严重等级的失败检测结果。",
            "优先处理日志、身份与数据保护控制项。",
            "复核高权限访问与暴露资源。",
            "将中危检测结果纳入短期修复计划跟踪。",
            "复核反复出现失败检测结果的服务和类别。",
            "使用扫描结果驱动告警和控制有效性验证。",
            "采用持续 CSPM 监控和定期访问复核。",
            "将报告生成纳入常态化安全运营流程。",
            "将高优先级检测结果接入事件响应流程。",
            "在历史数据和合规数据可靠后使用趋势与合规模块。",
        ],
    ),
    "ja-JP": ReportDocxText(
        severity={
            "critical": "重大",
            "high": "高",
            "medium": "中",
            "low": "低",
            "informational": "情報",
        },
        labels={
            "account_id": "アカウント ID",
            "affected_assets": "影響資産",
            "affected_resources": "影響リソース",
            "assessment_date": "評価日",
            "assessment_name": "評価名",
            "assessment_scope": "評価範囲",
            "category": "カテゴリ",
            "check_id": "チェック ID",
            "check_title": "チェックタイトル",
            "cloud_provider": "クラウドプロバイダー",
            "count": "件数",
            "current_status": "現在の状態",
            "description": "説明",
            "field": "項目",
            "finding": "検出結果",
            "finding_id": "検出 ID",
            "finding_overview": "検出結果概要",
            "findings": "検出数",
            "item": "項目",
            "open": "未対応",
            "overview": "概要",
            "priority": "優先度",
            "region": "リージョン",
            "resource_count": "リソース数",
            "resource_name": "リソース名",
            "resource_type": "リソースタイプ",
            "risk": "リスク",
            "executive_summary": "エグゼクティブサマリー",
            "remediation_guidance": "修復ガイダンス",
            "references": "参考資料",
            "service": "サービス",
            "severity": "重大度",
            "status": "ステータス",
            "value": "値",
        },
        fallback={
            "assessment_name": "クラウドセキュリティ評価",
            "assessment_scope": "{provider} クラウドセキュリティ評価",
            "global": "グローバル",
            "no_external_reference": "スキャンデータに外部参照リンクはありません。",
            "no_findings": "検出なし",
            "no_findings_available": "スキャンデータに失敗した検出結果はありません。",
            "no_findings_severity": "この重大度の検出結果はありません。",
            "no_narrative": "スキャンデータに説明文はありません。",
            "no_resource": "リソースなし",
            "none": "なし",
            "security_finding": "セキュリティ検出結果",
            "uncategorized": "未分類",
            "unknown": "不明",
        },
        recommendations=[
            "最も重大度の高い失敗検出結果を優先的に修復してください。",
            "ログ、ID、データ保護のコントロールを優先してください。",
            "特権アクセスと公開リソースを確認してください。",
            "中程度の検出結果は短期修復計画で追跡してください。",
            "失敗が繰り返されるサービスとカテゴリを確認してください。",
            "スキャン結果をアラートとコントロール検証に活用してください。",
            "継続的な CSPM 監視と定期的なアクセスレビューを導入してください。",
            "レポート生成を定常的なセキュリティ運用に組み込んでください。",
            "高優先度の検出結果をインシデント対応フローに連携してください。",
            "信頼できる履歴データとコンプライアンスデータが揃った後に、傾向分析とコンプライアンス機能を利用してください。",
        ],
    ),
}

TEMPLATE_ROOT = Path(__file__).resolve().parent / "report_templates"
EXECUTIVE_TEMPLATE = (
    TEMPLATE_ROOT / "en" / "executive_report" / "executive_report-template.docx"
)
FINDINGS_TEMPLATE = TEMPLATE_ROOT / "en" / "findings_report" / "Findings Report.docx"
EXECUTIVE_TEMPLATES = {
    "en": EXECUTIVE_TEMPLATE,
    "zh-CN": (
        TEMPLATE_ROOT
        / "zh-CN"
        / "executive_report"
        / "executive_report-template.docx"
    ),
    "ja-JP": (
        TEMPLATE_ROOT
        / "ja-JP"
        / "executive_report"
        / "executive_report-template.docx"
    ),
}
FINDINGS_TEMPLATES = {
    "en": FINDINGS_TEMPLATE,
    "zh-CN": TEMPLATE_ROOT / "zh-CN" / "findings_report" / "Findings Report.docx",
    "ja-JP": TEMPLATE_ROOT / "ja-JP" / "findings_report" / "Findings Report.docx",
}
CANONICAL_FIGURE_TITLES = {
    "图 1-1 风险分布": "Figure 1-1 Risk Distribution",
    "图 1-2 风险类别": "Figure 1-2 Risk Categories",
    "图 2-1 资产分布": "Figure 2-1 Asset Distribution",
    "图 2-2 按区域分布的资源": "Figure 2-2 Resource Distribution by Region",
    "图 3-1 按服务统计检测结果": "Figure 3-1 Findings by Service",
    "图 3-1 按服务统计发现": "Figure 3-1 Findings by Service",
    "图 3-2 按类别统计检测结果": "Figure 3-2 Findings by Category",
    "图 3-2 按类别统计发现": "Figure 3-2 Findings by Category",
    "图 1-1 检测结果分布": "Figure 1-1 Findings Distribution",
    "图 1-1 发现分布": "Figure 1-1 Findings Distribution",
    "図 1-1 リスク分布": "Figure 1-1 Risk Distribution",
    "図 1-2 リスクカテゴリ": "Figure 1-2 Risk Categories",
    "図 2-1 資産分布": "Figure 2-1 Asset Distribution",
    "図 2-2 リージョン別リソース分布": (
        "Figure 2-2 Resource Distribution by Region"
    ),
    "図 3-1 サービス別検出結果": "Figure 3-1 Findings by Service",
    "図 3-2 カテゴリ別検出結果": "Figure 3-2 Findings by Category",
    "図 1-1 検出結果分布": "Figure 1-1 Findings Distribution",
}


def build_english_executive_report_docx(
    scan,
    rows: list[dict],
    findings: list,
    summary: dict,
    template_path: Path | None = None,
) -> bytes:
    """Build the English Executive Word report from exported scan data."""
    return build_executive_report_docx(
        scan,
        rows,
        findings,
        summary,
        locale="en",
        template_path=template_path,
    )


def build_executive_report_docx(
    scan,
    rows: list[dict],
    findings: list,
    summary: dict,
    locale: str = "en",
    template_path: Path | None = None,
) -> bytes:
    """Build the Executive Word report from exported scan data."""
    template = template_path or _template_path(locale, EXECUTIVE_TEMPLATES)
    text = _docx_text(locale)
    data = _build_executive_data(scan, rows, findings, summary, text)

    with zipfile.ZipFile(template, "r") as source:
        document_xml = etree.fromstring(source.read("word/document.xml"))
        chart_paths = _chart_paths_by_figure(source, document_xml)

        _replace_paragraph_text(document_xml, data["paragraphs"])
        _replace_tables(document_xml, data["tables"])
        _format_generated_layout(document_xml, report_type="executive", locale=locale)

        replacements = {}
        _ensure_page_number_footer(source, document_xml, replacements)
        replacements["word/document.xml"] = _xml_bytes(document_xml)
        settings_xml = etree.fromstring(source.read("word/settings.xml"))
        _enable_update_fields_on_open(settings_xml)
        replacements["word/settings.xml"] = _xml_bytes(settings_xml)
        for figure, series in data["charts"].items():
            chart_path = chart_paths.get(figure)
            if not chart_path:
                continue
            package_path = f"word/{chart_path}"
            chart_xml = etree.fromstring(source.read(package_path))
            _replace_chart_series(chart_xml, series)
            replacements[package_path] = _xml_bytes(chart_xml)

        output = io.BytesIO()
        with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as target:
            _write_docx_package(source, target, replacements)

    return output.getvalue()


def build_english_findings_report_docx(
    scan,
    rows: list[dict],
    findings: list,
    summary: dict,
    template_path: Path | None = None,
) -> bytes:
    """Build the English Findings Word report from exported scan data."""
    return build_findings_report_docx(
        scan,
        rows,
        findings,
        summary,
        locale="en",
        template_path=template_path,
    )


def build_findings_report_docx(
    scan,
    rows: list[dict],
    findings: list,
    summary: dict,
    locale: str = "en",
    template_path: Path | None = None,
) -> bytes:
    """Build the Findings Word report from exported scan data."""
    template = template_path or _template_path(locale, FINDINGS_TEMPLATES)
    text = _docx_text(locale)
    data = _build_findings_data(scan, rows, findings, summary, text)

    with zipfile.ZipFile(template, "r") as source:
        document_xml = etree.fromstring(source.read("word/document.xml"))
        chart_paths = _chart_paths_by_figure(source, document_xml)

        _replace_paragraph_text(document_xml, data["paragraphs"])
        _replace_tables(document_xml, data["tables"])
        _replace_findings_detail_blocks(document_xml, data["findings"], text)
        _replace_paragraph_text(
            document_xml,
            {"2.1 Finding {{finding_number}}3": "2.1 Finding Details"},
        )
        _replace_findings_toc(document_xml, data["findings"], text)
        _format_generated_layout(document_xml, report_type="findings", locale=locale)

        replacements = {}
        _ensure_page_number_footer(source, document_xml, replacements)
        replacements["word/document.xml"] = _xml_bytes(document_xml)
        settings_xml = etree.fromstring(source.read("word/settings.xml"))
        _enable_update_fields_on_open(settings_xml)
        replacements["word/settings.xml"] = _xml_bytes(settings_xml)
        for figure, series in data["charts"].items():
            chart_path = chart_paths.get(figure)
            if not chart_path:
                continue
            package_path = f"word/{chart_path}"
            chart_xml = etree.fromstring(source.read(package_path))
            _replace_chart_series(chart_xml, series)
            replacements[package_path] = _xml_bytes(chart_xml)

        output = io.BytesIO()
        with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as target:
            _write_docx_package(source, target, replacements)

    return output.getvalue()


def _docx_text(locale: str) -> ReportDocxText:
    return REPORT_DOCX_TEXT.get(locale, REPORT_DOCX_TEXT["en"])


def _template_path(locale: str, templates: dict[str, Path]) -> Path:
    template = templates.get(locale) or templates["en"]
    if template.is_file():
        return template
    return templates["en"]


def _write_docx_package(source, target, replacements: dict[str, bytes]) -> None:
    source_names = set()
    for item in source.infolist():
        source_names.add(item.filename)
        content = replacements.get(item.filename)
        if content is None:
            content = source.read(item.filename)
        target.writestr(item, content)

    for filename, content in replacements.items():
        if filename not in source_names:
            target.writestr(filename, content)


def _build_executive_data(
    scan,
    rows: list[dict],
    findings: list,
    summary: dict,
    text: ReportDocxText,
) -> dict:
    unique_rows = _unique_finding_rows(rows)
    risk_rows = {
        uid: row for uid, row in unique_rows.items() if row.get("status") == "FAIL"
    }
    resources = _unique_resources(rows)
    severity_counts = Counter(row.get("severity") or "" for row in risk_rows.values())
    status_counts = Counter(row.get("status") or "" for row in unique_rows.values())
    region_counts = _count_resources_by(resources.values(), "region", text)
    resource_type_counts = _count_resources_by(resources.values(), "type", text)
    category_by_uid = _category_by_finding_uid(findings)
    category_counts = Counter(
        category_by_uid.get(uid, text.fallback["uncategorized"]) for uid in risk_rows
    )
    service_severity = _severity_matrix(risk_rows.values(), "service", text)

    top_risk_rows = _top_risk_rows(risk_rows, category_by_uid)
    critical_rows = [row for row in top_risk_rows if row["severity"] == "critical"]
    high_rows = [row for row in top_risk_rows if row["severity"] == "high"]
    recommendation_replacements = {
        "Enable MFA for all IAM users with console access.": _recommendation_line(
            top_risk_rows,
            0,
            text.recommendations[0],
            text,
        ),
        "Enable CloudTrail logging across all AWS regions.": _recommendation_line(
            top_risk_rows,
            1,
            text.recommendations[1],
            text,
        ),
        "Review privileged IAM permissions.": _recommendation_line(
            top_risk_rows,
            2,
            text.recommendations[2],
            text,
        ),
        text.recommendations[0]: _recommendation_line(
            top_risk_rows,
            0,
            text.recommendations[0],
            text,
        ),
        text.recommendations[1]: _recommendation_line(
            top_risk_rows,
            1,
            text.recommendations[1],
            text,
        ),
        text.recommendations[2]: _recommendation_line(
            top_risk_rows,
            2,
            text.recommendations[2],
            text,
        ),
        "Implement centralized log monitoring.": text.recommendations[3],
        "Perform periodic IAM access reviews.": text.recommendations[4],
        "Strengthen account activity alerting.": text.recommendations[5],
        "Adopt Zero Trust access controls.": text.recommendations[6],
        "Implement continuous CSPM monitoring.": text.recommendations[7],
        "Integrate cloud security findings into the incident response process.": (
            text.recommendations[8]
        ),
        "Establish compliance-driven cloud governance.": text.recommendations[9],
        text.recommendations[3]: text.recommendations[3],
        text.recommendations[4]: text.recommendations[4],
        text.recommendations[5]: text.recommendations[5],
        text.recommendations[6]: text.recommendations[6],
        text.recommendations[7]: text.recommendations[7],
        text.recommendations[8]: text.recommendations[8],
        text.recommendations[9]: text.recommendations[9],
    }

    return {
        "paragraphs": {
            "Assessment Name: {{assessment_name}}": (
                f"{text.labels['assessment_name']}: {_scan_name(scan, text)}"
            ),
            f"{text.labels['assessment_name']}: {{{{assessment_name}}}}": (
                f"{text.labels['assessment_name']}: {_scan_name(scan, text)}"
            ),
            "Cloud Provider: {{cloud_provider}}": (
                f"{text.labels['cloud_provider']}: {_provider_name(scan)}"
            ),
            f"{text.labels['cloud_provider']}: {{{{cloud_provider}}}}": (
                f"{text.labels['cloud_provider']}: {_provider_name(scan)}"
            ),
            "Account ID: {{account_id}}": f"{text.labels['account_id']}: {_provider_uid(scan)}",
            f"{text.labels['account_id']}: {{{{account_id}}}}": (
                f"{text.labels['account_id']}: {_provider_uid(scan)}"
            ),
            "Assessment Date: {{assessment_date}}": (
                f"{text.labels['assessment_date']}: {_assessment_date(scan, summary)}"
            ),
            f"{text.labels['assessment_date']}: {{{{assessment_date}}}}": (
                f"{text.labels['assessment_date']}: {_assessment_date(scan, summary)}"
            ),
            **recommendation_replacements,
        },
        "tables": {
            1: [
                [text.labels["item"], text.labels["value"]],
                [text.labels["assessment_name"], _scan_name(scan, text)],
                [text.labels["cloud_provider"], _provider_name(scan)],
                [text.labels["account_id"], _provider_uid(scan)],
                [text.labels["assessment_date"], _assessment_date(scan, summary)],
                [
                    text.labels["assessment_scope"],
                    text.fallback["assessment_scope"].format(provider=_provider_name(scan)),
                ],
            ],
            2: [[text.labels["severity"], text.labels["count"]]]
            + [
                [text.severity[severity], str(severity_counts.get(severity, 0))]
                for severity in SEVERITY_ORDER
            ],
            3: _finding_table(
                [
                    text.labels["finding"],
                    text.labels["affected_assets"],
                    text.labels["risk"],
                ],
                critical_rows,
                text,
            ),
            4: _finding_table(
                [
                    text.labels["finding"],
                    text.labels["affected_assets"],
                    text.labels["risk"],
                ],
                high_rows,
                text,
            ),
            5: _counter_table(text.labels["category"], text.labels["findings"], category_counts, text),
            6: _counter_table(text.labels["resource_type"], text.labels["count"], resource_type_counts, text),
            7: _counter_table(text.labels["region"], text.labels["resource_count"], region_counts, text),
            8: _service_severity_table(service_severity, text),
            9: _counter_table(text.labels["category"], text.labels["findings"], category_counts, text),
            10: _priority_table(top_risk_rows, {"critical", "high"}, text),
            11: _priority_table(top_risk_rows, {"medium"}, text),
            12: _priority_table(top_risk_rows, {"low", "informational"}, text),
        },
        "charts": {
            "Figure 1-1 Risk Distribution": [
                (
                    text.labels["count"],
                    [text.severity[s] for s in SEVERITY_ORDER],
                    [severity_counts.get(s, 0) for s in SEVERITY_ORDER],
                )
            ],
            "Figure 1-2 Risk Categories": [
                (text.labels["findings"], *_chart_categories_values(category_counts, text))
            ],
            "Figure 2-1 Asset Distribution": [
                (text.labels["resource_count"], *_chart_categories_values(resource_type_counts, text))
            ],
            "Figure 2-2 Resource Distribution by Region": [
                (text.labels["resource_count"], *_chart_categories_values(region_counts, text))
            ],
            "Figure 3-1 Findings by Service": _service_severity_chart(service_severity, text),
            "Figure 3-2 Findings by Category": [
                (text.labels["findings"], *_chart_categories_values(category_counts, text))
            ],
        },
        "status_counts": status_counts,
    }


def _build_findings_data(
    scan,
    rows: list[dict],
    findings: list,
    summary: dict,
    text: ReportDocxText,
) -> dict:
    groups = _finding_detail_groups(rows, findings, text)
    severity_counts = Counter(group["severity"] for group in groups)

    return {
        "paragraphs": {
            "Assessment Name: {{assessment_name}}": (
                f"{text.labels['assessment_name']}: {_scan_name(scan, text)}"
            ),
            f"{text.labels['assessment_name']}: {{{{assessment_name}}}}": (
                f"{text.labels['assessment_name']}: {_scan_name(scan, text)}"
            ),
            "Cloud Provider: {{cloud_provider}}": (
                f"{text.labels['cloud_provider']}: {_provider_name(scan)}"
            ),
            f"{text.labels['cloud_provider']}: {{{{cloud_provider}}}}": (
                f"{text.labels['cloud_provider']}: {_provider_name(scan)}"
            ),
            "Account ID: {{account_id}}": f"{text.labels['account_id']}: {_provider_uid(scan)}",
            f"{text.labels['account_id']}: {{{{account_id}}}}": (
                f"{text.labels['account_id']}: {_provider_uid(scan)}"
            ),
            "Assessment Date: {{assessment_date}}": (
                f"{text.labels['assessment_date']}: {_assessment_date(scan, summary)}"
            ),
            f"{text.labels['assessment_date']}: {{{{assessment_date}}}}": (
                f"{text.labels['assessment_date']}: {_assessment_date(scan, summary)}"
            ),
        },
        "tables": {
            1: [[text.labels["severity"], text.labels["count"]]]
            + [
                [text.severity[severity], str(severity_counts.get(severity, 0))]
                for severity in ["critical", "high", "medium", "low"]
            ],
        },
        "charts": {
            "Figure 1-1 Findings Distribution": [
                (
                    text.labels["count"],
                    [text.severity[s] for s in ["critical", "high", "medium", "low"]],
                    [severity_counts.get(s, 0) for s in ["critical", "high", "medium", "low"]],
                )
            ],
        },
        "findings": groups,
    }


def _finding_detail_groups(
    rows: list[dict],
    findings: list,
    text: ReportDocxText,
) -> list[dict]:
    metadata_by_check_id = _metadata_by_check_id(findings)
    grouped = {}
    for row in rows:
        if row.get("status") != "FAIL":
            continue
        key = (
            row.get("check_id") or row.get("uid") or "unknown",
            row.get("severity") or "informational",
            row.get("service") or "unknown",
        )
        group = grouped.setdefault(
            key,
            {
                "check_id": row.get("check_id") or "",
                "check_title": row.get("check_title") or row.get("check_id") or "",
                "severity": row.get("severity") or "informational",
                "service": row.get("service") or "",
                "description": row.get("description") or "",
                "risk": row.get("risk") or "",
                "remediation": row.get("remediation") or "",
                "status_extended": row.get("status_extended") or "",
                "resources": [],
                "metadata": metadata_by_check_id.get(row.get("check_id") or "", {}),
            },
        )
        if row.get("resource_uid"):
            group["resources"].append(
                {
                    "uid": row.get("resource_uid") or "",
                    "name": row.get("resource_name") or row.get("resource_uid") or "",
                    "type": row.get("resource_type") or text.fallback["unknown"],
                    "region": row.get("region") or text.fallback["global"],
                    "service": row.get("service") or group["service"],
                }
            )

    severity_rank = {severity: index for index, severity in enumerate(SEVERITY_ORDER)}
    details = []
    for index, group in enumerate(
        sorted(
            grouped.values(),
            key=lambda item: (
                severity_rank.get(item["severity"], len(SEVERITY_ORDER)),
                item["check_title"],
            ),
        ),
        start=1,
    ):
        resources = _unique_resource_rows(group["resources"])
        metadata = group["metadata"]
        detail = {
            **group,
            "number": index,
            "finding_id": f"F-{index:03d}",
            "title": group["check_title"]
            or group["check_id"]
            or f"{text.labels['finding']} {index:03d}",
            "severity_label": text.severity.get(
                group["severity"], _label(group["severity"], text)
            ),
            "priority": _priority_for_severity(group["severity"]),
            "category": _category_from_metadata(metadata, group["service"], text),
            "resources": resources,
            "summary": _finding_summary_text(group, text),
            "summary_items": _finding_summary_items(group, text),
            "actions": _remediation_actions(group, text),
            "references": _finding_references(metadata, text),
        }
        details.append(detail)

    if details:
        return details

    return [
        {
            "number": 1,
            "finding_id": "F-001",
            "check_id": text.fallback["no_findings"],
            "check_title": text.fallback["no_findings"],
            "title": text.fallback["no_findings"],
            "severity": "informational",
            "severity_label": text.severity["informational"],
            "priority": "P3",
            "category": text.fallback["none"],
            "service": text.fallback["none"],
            "resources": [],
            "summary": text.fallback["no_findings_available"],
            "summary_items": [
                (text.labels["executive_summary"], text.fallback["no_findings_available"])
            ],
            "actions": [text.recommendations[6]],
            "references": [text.fallback["no_external_reference"]],
        }
    ]


def _metadata_by_check_id(findings: list) -> dict[str, dict]:
    metadata = {}
    for finding in findings:
        check_metadata = getattr(finding, "check_metadata", {}) or {}
        check_id = (
            check_metadata.get("checkid")
            or check_metadata.get("CheckID")
            or getattr(finding, "check_id", "")
        )
        if check_id and check_id not in metadata:
            metadata[str(check_id)] = check_metadata
    return metadata


def _unique_resource_rows(resources: list[dict]) -> list[dict]:
    unique = {}
    for resource in resources:
        key = resource.get("uid") or resource.get("name") or str(len(unique))
        unique[key] = resource
    return list(unique.values())


def _category_from_metadata(
    metadata: dict,
    fallback: str,
    text: ReportDocxText | None = None,
) -> str:
    text = text or REPORT_DOCX_TEXT["en"]
    categories = metadata.get("categories") or []
    if isinstance(categories, str):
        return _label(categories, text)
    if categories:
        return _label(categories[0], text)
    return _label(
        metadata.get("servicename") or fallback or text.fallback["uncategorized"],
        text,
    )


def _priority_for_severity(severity: str) -> str:
    if severity in {"critical", "high"}:
        return "P1"
    if severity == "medium":
        return "P2"
    return "P3"


def _finding_summary_items(group: dict, text: ReportDocxText) -> list[tuple[str, str]]:
    items = []
    if group.get("description"):
        items.append(
            (
                text.labels["description"],
                _short_text(_clean_markdown(group["description"]), 700),
            )
        )
    if group.get("risk"):
        items.append((text.labels["risk"], _short_text(_clean_markdown(group["risk"]), 700)))
    if group.get("status_extended"):
        status_extended = localize_status_extended(
            _clean_markdown(group["status_extended"]),
            _locale_for_text(text),
        )
        items.append((text.labels["current_status"], _short_text(status_extended, 500)))
    if not items:
        items.append((text.labels["executive_summary"], text.fallback["no_narrative"]))
    return items


def _finding_summary_text(group: dict, text: ReportDocxText) -> str:
    return _short_text(
        " ".join(f"{label}: {value}" for label, value in _finding_summary_items(group, text)),
        1200,
    )


def _locale_for_text(text: ReportDocxText) -> str:
    for locale, candidate in REPORT_DOCX_TEXT.items():
        if text is candidate:
            return locale
    return "en"


def localize_status_extended(status_extended: str, locale: str) -> str:
    if not status_extended or locale == "en":
        return status_extended or ""

    status_extended = status_extended.strip()
    exact = STATUS_EXTENDED_TRANSLATIONS.get(locale, {}).get(status_extended)
    if exact:
        return exact

    if locale == "zh-CN":
        return _localize_status_extended_zh(status_extended)
    if locale == "ja-JP":
        return _localize_status_extended_ja(status_extended)
    return status_extended


def _localize_status_extended_zh(status_extended: str) -> str:
    patterns = [
        (r"^Lambda function (.+) is not inside a VPC$", r"Lambda 函数 \1 不在 VPC 内。"),
        (r"^Lambda function (.+) is not recorded by CloudTrail\.$", r"Lambda 函数 \1 未被 CloudTrail 记录。"),
        (r"^Lambda function (.+) has a resource-based policy with public access\.$", r"Lambda 函数 \1 的基于资源的策略允许公开访问。"),
        (r"^Lambda function (.+) has a publicly accessible function URL\.$", r"Lambda 函数 \1 的函数 URL 可公开访问。"),
        (r"^Root user in the account was last accessed (.+) days ago\.$", r"此账号中的 root 用户最近一次访问是在 \1 天前。"),
        (r"^Root account has one active access key\.$", r"root 账号存在一个活跃访问密钥。"),
        (r"^Root account has a virtual MFA instead of a hardware MFA device enabled\.$", r"root 账号启用了虚拟 MFA，而不是硬件 MFA 设备。"),
        (r"^Block Public Access is not configured for the account (.+)\.$", r"账号 \1 未配置 Block Public Access。"),
        (r"^S3 Bucket (.+) does not have correct cross region replication configuration\.$", r"S3 Bucket \1 未配置正确的跨区域复制。"),
        (r"^S3 Bucket (.+) does not have a bucket policy, thus it allows HTTP requests\.$", r"S3 Bucket \1 没有 bucket policy，因此允许 HTTP 请求。"),
        (r"^S3 Bucket (.+) has server access logging disabled\.$", r"S3 Bucket \1 已禁用服务器访问日志。"),
        (r"^Server Side Encryption is not configured with kms for S3 Bucket (.+)\.$", r"S3 Bucket \1 未配置基于 KMS 的服务端加密。"),
        (r"^Log Group (.+) does not have AWS KMS keys associated\.$", r"Log Group \1 未关联 AWS KMS key。"),
        (r"^Network ACL (.+) has every port open to the Internet\.$", r"Network ACL \1 向互联网开放了所有端口。"),
        (r"^Network ACL (.+) has SSH port 22 open to the Internet\.$", r"Network ACL \1 向互联网开放了 SSH 22 端口。"),
        (r"^Network ACL (.+) has Microsoft RDP port 3389 open to the Internet\.$", r"Network ACL \1 向互联网开放了 Microsoft RDP 3389 端口。"),
        (r"^Security group (.+) it is not being used\.$", r"Security group \1 当前未被使用。"),
        (r"^Inline policy (.+) attached to user (.+) allows privilege escalation using the following actions: (.+)\.$", r"附加到用户 \2 的内联策略 \1 允许通过以下操作进行权限提升：\3。"),
        (r"^Inline policy (.+) attached to user (.+) allows '(.+)' administrative privileges\.$", r"附加到用户 \2 的内联策略 \1 允许 '\3' 管理员权限。"),
        (r"^Inline policy (.+) attached to user (.+) allows '(.+)' privileges to all resources\.$", r"附加到用户 \2 的内联策略 \1 允许对所有资源使用 '\3' 权限。"),
        (r"^Inline policy (.+) attached to user (.+) allows '(.+)' privileges\.$", r"附加到用户 \2 的内联策略 \1 允许 '\3' 权限。"),
        (r"^IAM password policy does not require at least one lowercase letter\.$", r"IAM 密码策略未要求至少包含一个小写字母。"),
        (r"^IAM password policy does not require minimum length of 14 characters\.$", r"IAM 密码策略未要求最小长度为 14 个字符。"),
        (r"^IAM password policy does not require at least one number\.$", r"IAM 密码策略未要求至少包含一个数字。"),
        (r"^IAM password policy reuse prevention is less than 24 or not set\.$", r"IAM 密码策略的重复使用限制小于 24 次或未设置。"),
        (r"^IAM password policy does not require at least one symbol\.$", r"IAM 密码策略未要求至少包含一个符号。"),
        (r"^IAM password policy does not require at least one uppercase letter\.$", r"IAM 密码策略未要求至少包含一个大写字母。"),
        (r"^User (.+) has the policy (.+) attached\.$", r"用户 \1 附加了策略 \2。"),
        (r"^User (.+) has the inline policy (.+) attached\.$", r"用户 \1 附加了内联策略 \2。"),
        (r"^IAM Service Role (.+) does not prevent against a cross-service confused deputy attack\.$", r"IAM Service Role \1 未防止跨服务 confused deputy 攻击。"),
        (r"^User (.+) does not have any type of MFA enabled\.$", r"用户 \1 未启用任何类型的 MFA。"),
        (r"^AWS Support Access policy is not attached to any role\.$", r"AWS Support Access 策略未附加到任何角色。"),
        (r"^User (.+) has Console Password enabled but MFA disabled\.$", r"用户 \1 启用了控制台密码，但未启用 MFA。"),
        (r"^(.+) is not enabled in this account\.$", r"\1 未在此账号中启用。"),
        (r"^(.+) is not enabled for this region\.$", r"\1 未在此区域中启用。"),
        (r"^(.+) is not enabled\.$", r"\1 未启用。"),
        (r"^(.+) is disabled\.$", r"\1 已禁用。"),
        (r"^AWS Config recorder (.+) is disabled\.$", r"AWS Config recorder \1 已禁用。"),
        (r"^No (.+) were found\.$", r"未发现 \1。"),
        (r"^No (.+) found\.$", r"未发现 \1。"),
        (r"^(.+) has termination protection disabled\.$", r"\1 未启用终止保护。"),
        (r"^(.+) has MFA Delete disabled\.$", r"\1 已禁用 MFA Delete。"),
        (r"^(.+) has Object Lock disabled\.$", r"\1 已禁用 Object Lock。"),
        (r"^(.+) has versioning disabled\.$", r"\1 已禁用版本控制。"),
        (r"^(.+) does not have event notifications enabled\.$", r"\1 未启用事件通知。"),
        (r"^(.+) does not have a lifecycle configuration enabled\.$", r"\1 未启用生命周期配置。"),
    ]
    for pattern, replacement in patterns:
        translated = re.sub(pattern, replacement, status_extended)
        if translated != status_extended:
            return translated
    return status_extended


def _localize_status_extended_ja(status_extended: str) -> str:
    patterns = [
        (r"^Lambda function (.+) is not inside a VPC$", r"Lambda 関数 \1 は VPC 内にありません。"),
        (r"^Lambda function (.+) is not recorded by CloudTrail\.$", r"Lambda 関数 \1 は CloudTrail に記録されていません。"),
        (r"^Lambda function (.+) has a resource-based policy with public access\.$", r"Lambda 関数 \1 のリソースベースポリシーが公開アクセスを許可しています。"),
        (r"^Lambda function (.+) has a publicly accessible function URL\.$", r"Lambda 関数 \1 の関数 URL が公開アクセス可能です。"),
        (r"^Root user in the account was last accessed (.+) days ago\.$", r"このアカウントの root ユーザーは \1 日前に最後にアクセスされました。"),
        (r"^Root account has one active access key\.$", r"root アカウントに有効なアクセスキーが 1 つあります。"),
        (r"^Root account has a virtual MFA instead of a hardware MFA device enabled\.$", r"root アカウントではハードウェア MFA デバイスではなく仮想 MFA が有効化されています。"),
        (r"^Block Public Access is not configured for the account (.+)\.$", r"アカウント \1 に Block Public Access が設定されていません。"),
        (r"^S3 Bucket (.+) does not have correct cross region replication configuration\.$", r"S3 Bucket \1 に正しいクロスリージョンレプリケーション設定がありません。"),
        (r"^S3 Bucket (.+) does not have a bucket policy, thus it allows HTTP requests\.$", r"S3 Bucket \1 には bucket policy がないため、HTTP リクエストを許可しています。"),
        (r"^S3 Bucket (.+) has server access logging disabled\.$", r"S3 Bucket \1 はサーバーアクセスログが無効化されています。"),
        (r"^Server Side Encryption is not configured with kms for S3 Bucket (.+)\.$", r"S3 Bucket \1 には KMS によるサーバーサイド暗号化が設定されていません。"),
        (r"^Log Group (.+) does not have AWS KMS keys associated\.$", r"Log Group \1 には AWS KMS key が関連付けられていません。"),
        (r"^Network ACL (.+) has every port open to the Internet\.$", r"Network ACL \1 はすべてのポートをインターネットに公開しています。"),
        (r"^Network ACL (.+) has SSH port 22 open to the Internet\.$", r"Network ACL \1 は SSH ポート 22 をインターネットに公開しています。"),
        (r"^Network ACL (.+) has Microsoft RDP port 3389 open to the Internet\.$", r"Network ACL \1 は Microsoft RDP ポート 3389 をインターネットに公開しています。"),
        (r"^Security group (.+) it is not being used\.$", r"Security group \1 は現在使用されていません。"),
        (r"^Inline policy (.+) attached to user (.+) allows privilege escalation using the following actions: (.+)\.$", r"ユーザー \2 にアタッチされたインラインポリシー \1 は、次のアクションによる権限昇格を許可しています: \3。"),
        (r"^Inline policy (.+) attached to user (.+) allows '(.+)' administrative privileges\.$", r"ユーザー \2 にアタッチされたインラインポリシー \1 は '\3' 管理者権限を許可しています。"),
        (r"^Inline policy (.+) attached to user (.+) allows '(.+)' privileges to all resources\.$", r"ユーザー \2 にアタッチされたインラインポリシー \1 は、すべてのリソースに対して '\3' 権限を許可しています。"),
        (r"^Inline policy (.+) attached to user (.+) allows '(.+)' privileges\.$", r"ユーザー \2 にアタッチされたインラインポリシー \1 は '\3' 権限を許可しています。"),
        (r"^IAM password policy does not require at least one lowercase letter\.$", r"IAM パスワードポリシーで小文字が 1 文字以上要求されていません。"),
        (r"^IAM password policy does not require minimum length of 14 characters\.$", r"IAM パスワードポリシーで 14 文字以上の最小長が要求されていません。"),
        (r"^IAM password policy does not require at least one number\.$", r"IAM パスワードポリシーで数字が 1 文字以上要求されていません。"),
        (r"^IAM password policy reuse prevention is less than 24 or not set\.$", r"IAM パスワードポリシーの再利用防止設定が 24 未満、または未設定です。"),
        (r"^IAM password policy does not require at least one symbol\.$", r"IAM パスワードポリシーで記号が 1 文字以上要求されていません。"),
        (r"^IAM password policy does not require at least one uppercase letter\.$", r"IAM パスワードポリシーで大文字が 1 文字以上要求されていません。"),
        (r"^User (.+) has the policy (.+) attached\.$", r"ユーザー \1 にポリシー \2 がアタッチされています。"),
        (r"^User (.+) has the inline policy (.+) attached\.$", r"ユーザー \1 にインラインポリシー \2 がアタッチされています。"),
        (r"^IAM Service Role (.+) does not prevent against a cross-service confused deputy attack\.$", r"IAM Service Role \1 はクロスサービス confused deputy 攻撃を防止していません。"),
        (r"^User (.+) does not have any type of MFA enabled\.$", r"ユーザー \1 はどの種類の MFA も有効化していません。"),
        (r"^AWS Support Access policy is not attached to any role\.$", r"AWS Support Access ポリシーがどのロールにもアタッチされていません。"),
        (r"^User (.+) has Console Password enabled but MFA disabled\.$", r"ユーザー \1 はコンソールパスワードが有効ですが、MFA が無効です。"),
        (r"^(.+) is not enabled in this account\.$", r"\1 はこのアカウントで有効化されていません。"),
        (r"^(.+) is not enabled for this region\.$", r"\1 はこのリージョンで有効化されていません。"),
        (r"^(.+) is not enabled\.$", r"\1 は有効化されていません。"),
        (r"^(.+) is disabled\.$", r"\1 は無効化されています。"),
        (r"^AWS Config recorder (.+) is disabled\.$", r"AWS Config recorder \1 は無効化されています。"),
        (r"^No (.+) were found\.$", r"\1 が見つかりません。"),
        (r"^No (.+) found\.$", r"\1 が見つかりません。"),
        (r"^(.+) has termination protection disabled\.$", r"\1 は終了保護が無効化されています。"),
        (r"^(.+) has MFA Delete disabled\.$", r"\1 は MFA Delete が無効化されています。"),
        (r"^(.+) has Object Lock disabled\.$", r"\1 は Object Lock が無効化されています。"),
        (r"^(.+) has versioning disabled\.$", r"\1 はバージョニングが無効化されています。"),
        (r"^(.+) does not have event notifications enabled\.$", r"\1 はイベント通知が有効化されていません。"),
        (r"^(.+) does not have a lifecycle configuration enabled\.$", r"\1 はライフサイクル設定が有効化されていません。"),
    ]
    for pattern, replacement in patterns:
        translated = re.sub(pattern, replacement, status_extended)
        if translated != status_extended:
            return translated
    return status_extended


def _remediation_actions(group: dict, text: ReportDocxText) -> list[str]:
    remediation = _clean_markdown(group.get("remediation") or "")
    lines = []
    for raw_line in remediation.splitlines():
        line = raw_line.strip()
        line = re.sub(r"^[-*•\d.\s]+", "", line).strip()
        if line:
            lines.append(line)
    if not lines and remediation:
        lines = [remediation]
    if not lines:
        lines = [
            f"{text.recommendations[0]} {group.get('check_title') or group.get('check_id') or text.fallback['security_finding']}."
        ]
    return [_short_text(line, 220) for line in lines[:4]]


def _finding_references(metadata: dict, text: ReportDocxText) -> list[str]:
    references = []
    recommendation = metadata.get("remediation", {}).get("recommendation", {})
    for value in [
        recommendation.get("url"),
        metadata.get("relatedurl"),
        *(metadata.get("additionalurls") or []),
    ]:
        if value and value not in references:
            references.append(str(value))
    return references[:3] or [text.fallback["no_external_reference"]]


def _unique_finding_rows(rows: list[dict]) -> dict[str, dict]:
    unique = {}
    affected_assets = defaultdict(set)
    for row in rows:
        uid = row.get("uid")
        if not uid:
            continue
        unique.setdefault(uid, row)
        resource_uid = row.get("resource_uid")
        if resource_uid:
            affected_assets[uid].add(resource_uid)

    for uid, row in unique.items():
        row["affected_assets"] = len(affected_assets[uid]) or 1
    return unique


def _unique_resources(rows: list[dict]) -> dict[str, dict]:
    resources = {}
    for row in rows:
        uid = row.get("resource_uid")
        if uid:
            resources[uid] = {
                "uid": uid,
                "name": row.get("resource_name") or "",
                "region": row.get("region") or "global",
                "service": row.get("service") or "unknown",
                "type": row.get("resource_type") or "Other",
            }
    return resources


def _category_by_finding_uid(findings: list) -> dict[str, str]:
    categories = {}
    for finding in findings:
        metadata = getattr(finding, "check_metadata", {}) or {}
        finding_categories = metadata.get("categories") or []
        if isinstance(finding_categories, str):
            category = finding_categories
        elif finding_categories:
            category = finding_categories[0]
        else:
            category = metadata.get("servicename") or "Uncategorized"
        categories[str(getattr(finding, "uid", ""))] = _label(category)
    return categories


def _top_risk_rows(unique_rows: dict[str, dict], category_by_uid: dict[str, str]) -> list[dict]:
    severity_rank = {severity: index for index, severity in enumerate(SEVERITY_ORDER)}
    failed = [
        {
            **row,
            "category": category_by_uid.get(uid, row.get("service") or "Uncategorized"),
        }
        for uid, row in unique_rows.items()
        if row.get("status") == "FAIL"
    ]
    return sorted(
        failed,
        key=lambda row: (
            severity_rank.get(row.get("severity"), len(SEVERITY_ORDER)),
            row.get("check_title") or row.get("check_id") or "",
        ),
    )


def _count_by(rows, field: str, text: ReportDocxText | None = None) -> Counter:
    text = text or REPORT_DOCX_TEXT["en"]
    return Counter(_label(row.get(field) or text.fallback["unknown"], text) for row in rows)


def _count_resources_by(
    resources,
    field: str,
    text: ReportDocxText | None = None,
) -> Counter:
    text = text or REPORT_DOCX_TEXT["en"]
    if field == "region":
        return Counter(str(resource.get(field) or text.fallback["global"]) for resource in resources)
    return Counter(_label(resource.get(field) or text.fallback["unknown"], text) for resource in resources)


def _severity_matrix(
    rows,
    field: str,
    text: ReportDocxText | None = None,
) -> dict[str, Counter]:
    text = text or REPORT_DOCX_TEXT["en"]
    matrix = defaultdict(Counter)
    for row in rows:
        key = _label(row.get(field) or text.fallback["unknown"], text)
        severity = row.get("severity")
        if severity in SEVERITY_ORDER:
            matrix[key][severity] += 1
    return dict(matrix)


def _finding_table(
    headers: list[str],
    rows: list[dict],
    text: ReportDocxText,
    limit: int = 8,
) -> list[list[str]]:
    table = [headers]
    for row in rows[:limit]:
        table.append(
            [
                row.get("check_title") or row.get("check_id") or "",
                str(row.get("affected_assets") or 1),
                _short_text(row.get("risk") or row.get("status_extended") or "", 160),
            ]
        )
    if len(table) == 1:
        table.append(
            [
                text.fallback["no_findings"],
                "0",
                text.fallback["no_findings_severity"],
            ]
        )
    return table


def _counter_table(
    label: str,
    count_label: str,
    counter: Counter,
    text: ReportDocxText,
    limit: int = 8,
) -> list[list[str]]:
    table = [[label, count_label]]
    for key, value in counter.most_common(limit):
        table.append([key, str(value)])
    if len(table) == 1:
        table.append([text.fallback["none"], "0"])
    return table


def _service_severity_table(
    matrix: dict[str, Counter],
    text: ReportDocxText,
    limit: int = 8,
) -> list[list[str]]:
    services = sorted(
        matrix,
        key=lambda service: sum(matrix[service].values()),
        reverse=True,
    )[:limit]
    table = [
        [
            text.labels["service"],
            text.severity["critical"],
            text.severity["high"],
            text.severity["medium"],
            text.severity["low"],
        ]
    ]
    for service in services:
        counts = matrix[service]
        table.append(
            [
                service,
                str(counts.get("critical", 0)),
                str(counts.get("high", 0)),
                str(counts.get("medium", 0)),
                str(counts.get("low", 0)),
            ]
        )
    if len(table) == 1:
        table.append([text.fallback["none"], "0", "0", "0", "0"])
    return table


def _priority_table(
    rows: list[dict],
    severities: set[str],
    text: ReportDocxText,
    limit: int = 8,
) -> list[list[str]]:
    table = [
        [
            text.labels["finding"],
            text.labels["severity"],
            text.labels["affected_assets"],
        ]
    ]
    for row in [row for row in rows if row.get("severity") in severities][:limit]:
        table.append(
            [
                row.get("check_title") or row.get("check_id") or "",
                text.severity.get(row.get("severity"), row.get("severity") or ""),
                str(row.get("affected_assets") or 1),
            ]
        )
    if len(table) == 1:
        table.append([text.fallback["no_findings"], "", "0"])
    return table


def _service_severity_chart(
    matrix: dict[str, Counter],
    text: ReportDocxText,
    limit: int = 8,
) -> list[tuple]:
    services = sorted(
        matrix,
        key=lambda service: sum(matrix[service].values()),
        reverse=True,
    )[:limit]
    if not services:
        services = [text.fallback["none"]]
    return [
        (
            text.severity[severity],
            services,
            [matrix.get(service, Counter()).get(severity, 0) for service in services],
        )
        for severity in ["critical", "high", "medium", "low"]
    ]


def _chart_categories_values(
    counter: Counter,
    text: ReportDocxText,
    limit: int = 8,
) -> tuple[list[str], list[int]]:
    items = counter.most_common(limit)
    if not items:
        return [text.fallback["none"]], [0]
    categories, values = zip(*items)
    return list(categories), list(values)


def _scan_name(scan, text: ReportDocxText | None = None) -> str:
    text = text or REPORT_DOCX_TEXT["en"]
    return str(
        getattr(scan, "name", "")
        or getattr(scan, "id", text.fallback["assessment_name"])
    )


def _provider_name(scan) -> str:
    provider = getattr(scan, "provider", None)
    return str(getattr(provider, "provider", "") or "").upper()


def _provider_uid(scan) -> str:
    provider = getattr(scan, "provider", None)
    return str(getattr(provider, "uid", "") or "")


def _assessment_date(scan, summary: dict) -> str:
    completed_at = getattr(scan, "completed_at", None)
    if completed_at:
        return completed_at.date().isoformat()
    scan_summary = summary.get("scan") or {}
    completed_at_summary = scan_summary.get("completed_at")
    if completed_at_summary:
        return completed_at_summary[:10]
    generated_at = summary.get("generated_at")
    if generated_at:
        return generated_at[:10]
    return datetime.now(UTC).date().isoformat()


def _recommendation_line(
    rows: list[dict],
    index: int,
    fallback: str,
    text: ReportDocxText,
) -> str:
    if index >= len(rows):
        return fallback
    row = rows[index]
    title = row.get("check_title") or row.get("check_id") or text.fallback["security_finding"]
    if text is REPORT_DOCX_TEXT["en"]:
        return f"Remediate {title}."
    return f"{fallback} {title}"


def _label(value: str, text: ReportDocxText | None = None) -> str:
    text = text or REPORT_DOCX_TEXT["en"]
    raw = str(value or "").strip()
    if not raw:
        return text.fallback["unknown"]

    known = {
        "acm": "ACM",
        "api": "API",
        "aws": "AWS",
        "cloudtrail": "CloudTrail",
        "cloudwatch": "CloudWatch",
        "ec2": "EC2",
        "ecr": "ECR",
        "efs": "EFS",
        "elb": "ELB",
        "iam": "IAM",
        "kms": "KMS",
        "rds": "RDS",
        "s3": "S3",
        "sns": "SNS",
        "sqs": "SQS",
        "vpc": "VPC",
        "waf": "WAF",
    }
    if raw.lower() in known:
        return known[raw.lower()]

    spaced = raw.replace("_", " ").replace("-", " ")
    spaced = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", spaced)
    spaced = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", spaced)
    parts = []
    for part in spaced.split():
        parts.append(known.get(part.lower(), part[:1].upper() + part[1:]))
    return " ".join(parts)


def _short_text(value: str, limit: int) -> str:
    clean = re.sub(r"[*`_#]+", "", str(value)).strip()
    clean = re.sub(r"\s+", " ", clean)
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rstrip() + "..."


def _clean_markdown(value: str) -> str:
    clean = re.sub(r"```.*?```", " ", str(value or ""), flags=re.DOTALL)
    clean = re.sub(r"[*`_#>]+", "", clean)
    clean = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1 (\2)", clean)
    clean = re.sub(r"\s+", " ", clean)
    return clean.strip()


def _replace_paragraph_text(document_xml, replacements: dict[str, str]) -> None:
    for paragraph in document_xml.xpath(".//w:p", namespaces=NS):
        current = _paragraph_text(paragraph).strip()
        if current in replacements:
            _set_paragraph_text(paragraph, replacements[current])


def _replace_findings_detail_blocks(
    document_xml,
    details: list[dict],
    text: ReportDocxText,
) -> None:
    body = document_xml.find("w:body", namespaces=NS)
    if body is None:
        return
    children = list(body)
    start = _body_paragraph_index_any(
        children,
        {
            "2.1 Finding {{finding_number}}",
            "2.1 检测结果 {{finding_number}}",
            "2.1 发现 {{finding_number}}",
            "2.1 検出結果 {{finding_number}}",
        },
    )
    end = _body_paragraph_index_any(
        children,
        {
            "Appendix A. Severity Definitions",
            "附录 A. 严重等级定义",
            "付録 A. 重大度定義",
        },
    )
    if start is None or end is None or start >= end:
        return

    template_block = children[start:end]
    for element in template_block:
        body.remove(element)

    insert_at = start
    for detail in details:
        block = [copy.deepcopy(element) for element in template_block]
        _populate_finding_block(block, detail, text)
        block = [element for element in block if element.get("data-delete") != "1"]
        for offset, element in enumerate(block):
            body.insert(insert_at + offset, element)
        insert_at += len(block)


def _body_paragraph_index(children: list, text: str) -> int | None:
    for index, element in enumerate(children):
        if element.tag == _qn("w:p") and _paragraph_text(element).strip() == text:
            return index
    return None


def _body_paragraph_index_any(children: list, texts: set[str]) -> int | None:
    for index, element in enumerate(children):
        if element.tag == _qn("w:p") and _paragraph_text(element).strip() in texts:
            return index
    return None


def _replace_findings_toc(
    document_xml,
    findings: list[dict],
    text: ReportDocxText,
) -> None:
    detail_entry = _finding_details_toc_entry(text)
    toc_paragraphs = _toc_paragraphs(document_xml)
    if not toc_paragraphs:
        return

    detail_paragraph = None
    for paragraph in toc_paragraphs:
        paragraph_label = _paragraph_text(paragraph).strip()
        if paragraph_label.startswith(detail_entry) or paragraph_label.startswith(
            _legacy_finding_details_toc_entry(text)
        ):
            detail_paragraph = paragraph
            break
    if detail_paragraph is None:
        return

    for paragraph in toc_paragraphs:
        _set_findings_toc_spacing(paragraph)

    _remove_static_findings_toc_entries(toc_paragraphs)
    parent = detail_paragraph.getparent()
    if parent is None:
        return

    _set_paragraph_text_with_pageref(
        detail_paragraph,
        detail_entry,
        "toc_finding_details",
        fallback_page="3",
    )

    insert_after = detail_paragraph
    for finding in findings:
        paragraph = copy.deepcopy(detail_paragraph)
        _set_paragraph_text_with_pageref(
            paragraph,
            _finding_toc_entry(finding, text),
            _finding_bookmark_name(finding),
            fallback_page="3",
        )
        _set_toc_entry_indent(paragraph, left=360)
        _set_findings_toc_spacing(paragraph)
        parent.insert(parent.index(insert_after) + 1, paragraph)
        insert_after = paragraph

    for label, bookmark_name, fallback_page in _findings_appendix_toc_entries(text):
        paragraph = copy.deepcopy(detail_paragraph)
        _set_paragraph_text_with_pageref(
            paragraph,
            label,
            bookmark_name,
            fallback_page=fallback_page,
        )
        _set_toc_entry_indent(paragraph, left=0)
        _set_findings_toc_spacing(paragraph)
        parent.insert(parent.index(insert_after) + 1, paragraph)
        insert_after = paragraph


def _toc_paragraphs(document_xml) -> list:
    paragraphs = document_xml.xpath(".//w:p", namespaces=NS)
    toc_paragraphs = []
    in_toc = False
    for paragraph in paragraphs:
        paragraph_text = _paragraph_text(paragraph).strip()
        if paragraph_text in {"Table of Contents", "目录", "目次"}:
            in_toc = True
            continue
        if not in_toc:
            continue
        if paragraph.xpath(".//w:br[@w:type='page']", namespaces=NS):
            break
        toc_paragraphs.append(paragraph)
    return toc_paragraphs


def _remove_static_findings_toc_entries(toc_paragraphs: list) -> None:
    remove_entries = {
        "2.1 Finding Details",
        "2.1 Finding {{finding_number}}",
        "2.1.1 Overview",
        "2.1.2 Executive Summary",
        "2.1.3 Affected Resources",
        "2.1.4 Remediation Guidance",
        "2.1.5 References",
        "Appendix A. Severity Definitions",
        "2.1 检测结果 {{finding_number}}",
        "2.1.1 概览",
        "2.1.2 执行摘要",
        "2.1.3 受影响资源",
        "2.1.4 修复指导",
        "2.1.5 参考资料",
        "2.1 发现 {{finding_number}}",
        "2.1.1 概览",
        "2.1.2 执行摘要",
        "2.1.3 受影响资源",
        "2.1.4 修复指导",
        "2.1.5 参考资料",
        "附录 A. 严重等级定义",
        "2.1 検出結果 {{finding_number}}",
        "2.1.1 概要",
        "2.1.2 エグゼクティブサマリー",
        "2.1.3 影響リソース",
        "2.1.4 修復ガイダンス",
        "2.1.5 参考資料",
        "付録 A. 重大度定義",
    }
    for paragraph in list(toc_paragraphs):
        text = _paragraph_text(paragraph).strip()
        for entry in remove_entries:
            if text.startswith(entry):
                _remove_paragraph(paragraph)
                break


def _finding_details_toc_entry(text: ReportDocxText) -> str:
    if text is REPORT_DOCX_TEXT["zh-CN"]:
        return "2. 检测结果详情"
    if text is REPORT_DOCX_TEXT["ja-JP"]:
        return "2. 検出結果詳細"
    return "2. Finding Details"


def _legacy_finding_details_toc_entry(text: ReportDocxText) -> str:
    if text is REPORT_DOCX_TEXT["zh-CN"]:
        return "2. 发现详情"
    return _finding_details_toc_entry(text)


def _finding_toc_entry(finding: dict, text: ReportDocxText) -> str:
    title = _short_text(finding.get("title") or finding.get("check_title") or "", 90)
    return (
        f"2.{finding['number']} {text.labels['finding']} "
        f"{finding['finding_id']} - {title}"
    )


def _findings_appendix_toc_entries(text: ReportDocxText) -> list[tuple[str, str, str]]:
    if text is REPORT_DOCX_TEXT["zh-CN"]:
        return [("附录 A. 严重等级定义", "toc_findings_appendix_a", "5")]
    if text is REPORT_DOCX_TEXT["ja-JP"]:
        return [("付録 A. 重大度定義", "toc_findings_appendix_a", "5")]
    return [("Appendix A. Severity Definitions", "toc_findings_appendix_a", "5")]


def _finding_bookmark_name(finding: dict) -> str:
    return f"finding_{int(finding['number']):03d}"


def _set_toc_entry_indent(paragraph, left: int) -> None:
    ppr = _get_or_add(paragraph, "w:pPr", first=True)
    ind = ppr.find("w:ind", namespaces=NS)
    if ind is None:
        ind = etree.SubElement(ppr, _qn("w:ind"))
    ind.set(_qn("w:left"), str(left))
    ind.set(_qn("w:firstLine"), "0")


def _set_findings_toc_spacing(paragraph) -> None:
    _set_paragraph_spacing(paragraph, after=100, line=320, line_rule="auto")


def _populate_finding_block(
    block: list,
    detail: dict,
    text: ReportDocxText,
) -> None:
    overview_rows = [
        [text.labels["field"], text.labels["value"]],
        [text.labels["finding_id"], detail["finding_id"]],
        [text.labels["check_id"], detail["check_id"]],
        [text.labels["check_title"], detail["check_title"]],
        [text.labels["severity"], detail["severity_label"]],
        [text.labels["priority"], detail["priority"]],
        [text.labels["category"], detail["category"]],
        [text.labels["service"], _label(detail["service"], text)],
        [text.labels["status"], text.labels["open"]],
        [text.labels["affected_resources"], str(len(detail["resources"]))],
    ]
    resource_rows = [
        [
            text.labels["resource_name"],
            text.labels["resource_type"],
            text.labels["region"],
            text.labels["service"],
            text.labels["account_id"],
        ]
    ]
    for resource in detail["resources"][:20]:
        resource_rows.append(
            [
                _short_text(resource.get("name") or resource.get("uid") or "", 80),
                _label(resource.get("type") or text.fallback["unknown"], text),
                resource.get("region") or text.fallback["global"],
                _label(
                    resource.get("service")
                    or detail.get("service")
                    or text.fallback["unknown"],
                    text,
                ),
                _account_id_from_resource(resource.get("uid") or ""),
            ]
        )
    if len(resource_rows) == 1:
        resource_rows.append(
            [
                text.fallback["no_resource"],
                text.fallback["unknown"],
                text.fallback["global"],
                _label(detail["service"], text),
                "",
            ]
        )

    tables = []
    paragraphs = []
    for element in block:
        if element.tag == _qn("w:tbl"):
            tables.append(element)
        if element.tag == _qn("w:p"):
            paragraphs.append(element)
        tables.extend(element.xpath(".//w:tbl", namespaces=NS))
        paragraphs.extend(element.xpath(".//w:p", namespaces=NS))
    if tables:
        _replace_table(tables[0], overview_rows)
    if len(tables) > 1:
        _replace_table(tables[1], resource_rows)

    action_placeholders = [
        [
            "Enable CloudTrail.",
            "启用 CloudTrail。",
            "CloudTrail を有効化してください。",
        ],
        [
            "Enable multi-region logging.",
            "启用多区域日志记录。",
            "マルチリージョンログを有効化してください。",
        ],
        [
            "Store logs centrally in S3.",
            "将日志集中存储到 S3。",
            "ログを S3 に集中保管してください。",
        ],
        [
            "Configure log monitoring alerts.",
            "配置日志监控告警。",
            "ログ監視アラートを設定してください。",
        ],
    ]
    reference_placeholders = ["AWS Documentation", "CIS Benchmark", "Vendor Guidance"]
    actions = detail["actions"]
    references = detail["references"]

    for paragraph in list(paragraphs):
        paragraph_text = _paragraph_text(paragraph).strip()
        replacements = {
            "2.1 Finding {{finding_number}}": (
                f"2.{detail['number']} {text.labels['finding']} {detail['finding_id']} - "
                f"{_short_text(detail['title'], 90)}"
            ),
            "2.1 发现 {{finding_number}}": (
                f"2.{detail['number']} {text.labels['finding']} {detail['finding_id']} - "
                f"{_short_text(detail['title'], 90)}"
            ),
            f"2.1 {text.labels['finding']} {{{{finding_number}}}}": (
                f"2.{detail['number']} {text.labels['finding']} {detail['finding_id']} - "
                f"{_short_text(detail['title'], 90)}"
            ),
            "2.1.1 Overview": f"2.{detail['number']}.1 {text.labels['overview']}",
            f"2.1.1 {text.labels['overview']}": (
                f"2.{detail['number']}.1 {text.labels['overview']}"
            ),
            "2.1.2 Executive Summary": (
                f"2.{detail['number']}.2 {text.labels['executive_summary']}"
            ),
            f"2.1.2 {text.labels['executive_summary']}": (
                f"2.{detail['number']}.2 {text.labels['executive_summary']}"
            ),
            "2.1.3 Affected Resources": (
                f"2.{detail['number']}.3 {text.labels['affected_resources']}"
            ),
            f"2.1.3 {text.labels['affected_resources']}": (
                f"2.{detail['number']}.3 {text.labels['affected_resources']}"
            ),
            "2.1.4 Remediation Guidance": (
                f"2.{detail['number']}.4 {text.labels['remediation_guidance']}"
            ),
            f"2.1.4 {text.labels['remediation_guidance']}": (
                f"2.{detail['number']}.4 {text.labels['remediation_guidance']}"
            ),
            "2.1.5 References": (
                f"2.{detail['number']}.5 {text.labels['references']}"
            ),
            f"2.1.5 {text.labels['references']}": (
                f"2.{detail['number']}.5 {text.labels['references']}"
            ),
            "Table 2-1 Finding Overview": (
                _table_caption(
                    f"2-{detail['number'] * 2 - 1}",
                    text.labels["finding_overview"],
                    text,
                )
            ),
            "Table 2-2 Affected Resources": (
                _table_caption(
                    f"2-{detail['number'] * 2}",
                    text.labels["affected_resources"],
                    text,
                )
            ),
            _table_caption("2-1", text.labels["finding_overview"], text): (
                _table_caption(
                    f"2-{detail['number'] * 2 - 1}",
                    text.labels["finding_overview"],
                    text,
                )
            ),
            _table_caption("2-2", text.labels["affected_resources"], text): (
                _table_caption(
                    f"2-{detail['number'] * 2}",
                    text.labels["affected_resources"],
                    text,
                )
            ),
        }
        if paragraph_text in replacements:
            _set_paragraph_text(paragraph, replacements[paragraph_text])
            if paragraph_text in {
                "2.1 Finding {{finding_number}}",
                f"2.1 {text.labels['finding']} {{{{finding_number}}}}",
            }:
                _add_bookmark_to_paragraph(
                    paragraph,
                    _finding_bookmark_name(detail),
                    20000 + int(detail["number"]),
                )
            continue
        if paragraph_text.startswith("CloudTrail logging is not enabled"):
            _replace_paragraph_with_labeled_items(
                paragraph,
                detail["summary_items"],
                block,
            )
            continue
        matched_action_placeholder = False
        for index, placeholders in enumerate(action_placeholders):
            if paragraph_text not in placeholders:
                continue
            if index < len(actions):
                _set_paragraph_text(paragraph, actions[index])
            else:
                _remove_paragraph(paragraph)
            matched_action_placeholder = True
            break
        if matched_action_placeholder:
            continue
        if paragraph_text in reference_placeholders:
            index = reference_placeholders.index(paragraph_text)
            if index < len(references):
                _set_paragraph_text(paragraph, references[index])
            else:
                _remove_paragraph(paragraph)


def _remove_paragraph(paragraph) -> None:
    parent = paragraph.getparent()
    if parent is not None:
        parent.remove(paragraph)
    else:
        paragraph.set("data-delete", "1")


def _table_caption(number: str, title: str, text: ReportDocxText) -> str:
    if text is REPORT_DOCX_TEXT["en"]:
        return f"Table {number} {title}"
    return f"表 {number} {title}"


def _account_id_from_resource(resource_uid: str) -> str:
    match = re.search(r":(\d{12}):", resource_uid or "")
    if match:
        return match.group(1)
    match = re.search(r"\b\d{12}\b", resource_uid or "")
    return match.group(0) if match else ""


def _format_generated_layout(document_xml, report_type: str, locale: str) -> None:
    _center_caption_paragraphs(document_xml)
    _normalize_all_table_geometry(document_xml)
    _normalize_table_severity_text_colors(document_xml)
    _add_static_toc_target_bookmarks(document_xml, report_type)
    _add_static_toc_page_numbers(document_xml, report_type)
    _apply_estimated_toc_page_numbers(document_xml, report_type)
    _normalize_document_typography(document_xml, locale)


def _normalize_document_typography(document_xml, locale: str) -> None:
    font_name = DOCX_FONT_BY_LOCALE.get(locale, DOCX_FONT_BY_LOCALE["en"])
    tree = document_xml.getroottree()
    toc_sizes = {
        tree.getpath(paragraph): _toc_paragraph_font_size(label)
        for paragraph, label in _toc_entries_with_paragraphs(document_xml)
    }
    for paragraph in document_xml.xpath(".//w:p", namespaces=NS):
        size = toc_sizes.get(tree.getpath(paragraph), _paragraph_font_size(paragraph))
        paragraph_properties = _get_or_add(paragraph, "w:pPr", first=True)
        paragraph_run_properties = paragraph_properties.find("w:rPr", namespaces=NS)
        if paragraph_run_properties is None:
            paragraph_run_properties = etree.SubElement(
                paragraph_properties,
                _qn("w:rPr"),
            )
        _set_run_properties_typography(paragraph_run_properties, font_name, size)
        for run in paragraph.xpath("./w:r", namespaces=NS):
            _set_run_typography(run, font_name, size)
        for run in paragraph.xpath("./w:fldSimple/w:r", namespaces=NS):
            _set_run_typography(run, font_name, size)


def _paragraph_font_size(paragraph) -> int:
    text = _paragraph_text(paragraph).strip()
    style_id = _paragraph_style_id(paragraph)
    if style_id in {"Title", "TOCHeading"} or text in {
        "Table of Contents",
        "目录",
        "目次",
    }:
        return DOCX_SIZE_BIG_TITLE
    cover_size = _cover_paragraph_font_size(text)
    if cover_size:
        return cover_size
    if style_id == "Heading1" or _is_heading_1_text(text):
        return DOCX_SIZE_HEADING_1
    if style_id == "Heading2" or _is_heading_2_text(text):
        return DOCX_SIZE_HEADING_2
    if style_id == "Heading3" or _is_heading_3_text(text):
        return DOCX_SIZE_HEADING_3
    return DOCX_SIZE_BODY


def _toc_paragraph_font_size(label: str) -> int:
    if re.match(r"^\d+\.\d+\s+\S", label):
        return DOCX_SIZE_TOC_LEVEL_2
    return DOCX_SIZE_TOC_LEVEL_1


def _cover_paragraph_font_size(text: str) -> int | None:
    if text in DOCX_COVER_TITLES:
        return DOCX_SIZE_HEADING_2
    if text.startswith(DOCX_COVER_ASSESSMENT_PREFIXES):
        return DOCX_SIZE_BIG_TITLE
    if text.startswith(DOCX_COVER_STANDARD_PREFIXES):
        return DOCX_SIZE_HEADING_2
    if text.startswith(DOCX_COVER_DATE_PREFIXES):
        return DOCX_SIZE_HEADING_3
    return None


def _paragraph_style_id(paragraph) -> str:
    style = paragraph.find("w:pPr/w:pStyle", namespaces=NS)
    return style.get(_qn("w:val"), "") if style is not None else ""


def _is_heading_1_text(text: str) -> bool:
    return bool(
        re.match(r"^\d+\.\s+\S", text)
        or re.match(r"^Appendix [A-Z]\.\s+\S", text)
        or re.match(r"^附录 [A-Z]\.\s+\S", text)
        or re.match(r"^付録 [A-Z]\.\s+\S", text)
    )


def _is_heading_2_text(text: str) -> bool:
    return bool(re.match(r"^\d+\.\d+\s+\S", text))


def _is_heading_3_text(text: str) -> bool:
    return bool(re.match(r"^\d+\.\d+\.\d+\s+\S", text))


def _set_run_typography(run, font_name: str, size: int) -> None:
    run_properties = _get_or_add(run, "w:rPr", first=True)
    _set_run_properties_typography(run_properties, font_name, size)


def _set_run_properties_typography(run_properties, font_name: str, size: int) -> None:
    fonts = run_properties.find("w:rFonts", namespaces=NS)
    if fonts is None:
        fonts = etree.Element(_qn("w:rFonts"))
        run_properties.insert(0, fonts)
    for attribute in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
        fonts.attrib.pop(_qn(attribute), None)
    for attribute in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        fonts.set(_qn(attribute), font_name)

    size_element = run_properties.find("w:sz", namespaces=NS)
    if size_element is None:
        size_element = etree.SubElement(run_properties, _qn("w:sz"))
    size_element.set(_qn("w:val"), str(size))

    complex_size = run_properties.find("w:szCs", namespaces=NS)
    if complex_size is None:
        complex_size = etree.SubElement(run_properties, _qn("w:szCs"))
    complex_size.set(_qn("w:val"), str(size))


def _ensure_page_number_footer(source, document_xml, replacements: dict[str, bytes]) -> None:
    section_properties = document_xml.xpath(".//w:sectPr", namespaces=NS)
    if not section_properties:
        body = document_xml.find("w:body", namespaces=NS)
        if body is None:
            return
        section_property = etree.SubElement(body, _qn("w:sectPr"))
        section_properties = [section_property]

    relationships_path = "word/_rels/document.xml.rels"
    relationships_xml = etree.fromstring(source.read(relationships_path))
    footer_relationship = None
    for relationship in relationships_xml.findall(f"{{{REL_NS}}}Relationship"):
        if relationship.get("Type") == FOOTER_REL_TYPE:
            footer_relationship = relationship
            break

    if footer_relationship is None:
        footer_name = _next_footer_name(source.namelist())
        relationship_id = _next_relationship_id(relationships_xml)
        footer_relationship = etree.SubElement(
            relationships_xml,
            f"{{{REL_NS}}}Relationship",
        )
        footer_relationship.set("Id", relationship_id)
        footer_relationship.set("Type", FOOTER_REL_TYPE)
        footer_relationship.set("Target", footer_name)
    else:
        footer_name = footer_relationship.get("Target") or _next_footer_name(
            source.namelist()
        )
        footer_relationship.set("Target", footer_name)

    footer_package_path = (
        footer_name if footer_name.startswith("word/") else f"word/{footer_name}"
    )
    footer_part_name = footer_package_path.removeprefix("word/")
    replacements[footer_package_path] = _page_number_footer_xml()
    _ensure_footer_content_type(source, replacements, footer_part_name)

    relationship_id = footer_relationship.get("Id")
    if not relationship_id:
        return

    for section_property in section_properties:
        _apply_page_footer_to_section(section_property, relationship_id)

    replacements[relationships_path] = _xml_bytes(relationships_xml)


def _apply_page_footer_to_section(section_property, relationship_id: str) -> None:
    # WPS is stricter than Word here: default-only footer references may not be
    # rendered after template generation. Point all footer slots at the page
    # footer and make the footer margin explicit.
    for footer_type in ("default", "first", "even"):
        _set_section_footer_reference(section_property, footer_type, relationship_id)
    _ensure_section_footer_margin(section_property)


def _set_section_footer_reference(
    section_property,
    footer_type: str,
    relationship_id: str,
) -> None:
    footer_reference = None
    for candidate in section_property.findall("w:footerReference", namespaces=NS):
        if candidate.get(_qn("w:type")) == footer_type:
            footer_reference = candidate
            break
    if footer_reference is None:
        footer_reference = etree.Element(_qn("w:footerReference"))
        footer_reference.set(_qn("w:type"), footer_type)
        section_property.insert(_section_footer_reference_insert_index(section_property), footer_reference)
    footer_reference.set(_qn("r:id"), relationship_id)


def _section_footer_reference_insert_index(section_property) -> int:
    index = 0
    for index, child in enumerate(section_property):
        if child.tag not in {_qn("w:headerReference"), _qn("w:footerReference")}:
            return index
    return len(section_property)


def _ensure_section_footer_margin(section_property) -> None:
    page_margin = section_property.find("w:pgMar", namespaces=NS)
    if page_margin is None:
        page_margin = etree.Element(_qn("w:pgMar"))
        page_margin.set(_qn("w:top"), "1440")
        page_margin.set(_qn("w:right"), "1440")
        page_margin.set(_qn("w:bottom"), "1440")
        page_margin.set(_qn("w:left"), "1440")
        page_margin.set(_qn("w:gutter"), "0")
        section_property.insert(_section_page_margin_insert_index(section_property), page_margin)
    page_margin.set(_qn("w:footer"), page_margin.get(_qn("w:footer")) or "720")
    page_margin.set(_qn("w:header"), page_margin.get(_qn("w:header")) or "720")


def _section_page_margin_insert_index(section_property) -> int:
    for index, child in enumerate(section_property):
        if child.tag in {_qn("w:cols"), _qn("w:docGrid")}:
            return index
    return len(section_property)


def _next_footer_name(package_names: list[str]) -> str:
    footer_numbers = []
    for name in package_names:
        match = re.fullmatch(r"word/footer(\d+)\.xml", name)
        if match:
            footer_numbers.append(int(match.group(1)))
    return f"footer{(max(footer_numbers) if footer_numbers else 0) + 1}.xml"


def _next_relationship_id(relationships_xml) -> str:
    relationship_numbers = []
    for relationship in relationships_xml.findall(f"{{{REL_NS}}}Relationship"):
        relationship_id = relationship.get("Id") or ""
        match = re.fullmatch(r"rId(\d+)", relationship_id)
        if match:
            relationship_numbers.append(int(match.group(1)))
    return f"rId{(max(relationship_numbers) if relationship_numbers else 0) + 1}"


def _page_number_footer_xml() -> bytes:
    footer = etree.Element(_qn("w:ftr"), nsmap={"w": NS["w"]})
    paragraph = etree.SubElement(footer, _qn("w:p"))
    paragraph_properties = etree.SubElement(paragraph, _qn("w:pPr"))
    justification = etree.SubElement(paragraph_properties, _qn("w:jc"))
    justification.set(_qn("w:val"), "center")

    begin_run = etree.SubElement(paragraph, _qn("w:r"))
    begin = etree.SubElement(begin_run, _qn("w:fldChar"))
    begin.set(_qn("w:fldCharType"), "begin")
    begin.set(_qn("w:dirty"), "true")

    instruction_run = etree.SubElement(paragraph, _qn("w:r"))
    instruction = etree.SubElement(instruction_run, _qn("w:instrText"))
    instruction.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    instruction.text = " PAGE "

    separator_run = etree.SubElement(paragraph, _qn("w:r"))
    separator = etree.SubElement(separator_run, _qn("w:fldChar"))
    separator.set(_qn("w:fldCharType"), "separate")

    result_run = etree.SubElement(paragraph, _qn("w:r"))
    result = etree.SubElement(result_run, _qn("w:t"))
    result.text = "1"

    end_run = etree.SubElement(paragraph, _qn("w:r"))
    end = etree.SubElement(end_run, _qn("w:fldChar"))
    end.set(_qn("w:fldCharType"), "end")

    return _xml_bytes(footer)


def _ensure_footer_content_type(
    source,
    replacements: dict[str, bytes],
    footer_name: str,
) -> None:
    content_types_path = "[Content_Types].xml"
    content_types_xml = etree.fromstring(source.read(content_types_path))
    part_name = f"/word/{footer_name}"
    for override in content_types_xml.findall(f"{{{CONTENT_TYPES_NS}}}Override"):
        if override.get("PartName") == part_name:
            return

    override = etree.SubElement(
        content_types_xml,
        f"{{{CONTENT_TYPES_NS}}}Override",
    )
    override.set("PartName", part_name)
    override.set("ContentType", FOOTER_CONTENT_TYPE)
    replacements[content_types_path] = _xml_bytes(content_types_xml)


def _normalize_all_table_geometry(document_xml) -> None:
    for table in document_xml.xpath(".//w:tbl", namespaces=NS):
        _format_table_geometry(table)
        _set_table_borders(table)


def _center_caption_paragraphs(document_xml) -> None:
    for paragraph in document_xml.xpath(".//w:p", namespaces=NS):
        text = _paragraph_text(paragraph).strip()
        if not text.startswith(("Table ", "Figure ", "表 ", "图 ", "図 ")):
            continue
        ppr = _get_or_add(paragraph, "w:pPr", first=True)
        ind = ppr.find("w:ind", namespaces=NS)
        if ind is None:
            ind = etree.SubElement(ppr, _qn("w:ind"))
        ind.set(_qn("w:left"), "0")
        ind.set(_qn("w:firstLine"), "0")
        jc = ppr.find("w:jc", namespaces=NS)
        if jc is None:
            jc = etree.SubElement(ppr, _qn("w:jc"))
        jc.set(_qn("w:val"), "center")


def _add_static_toc_page_numbers(document_xml, report_type: str) -> None:
    toc_pages = {}
    final_toc_entry = ""
    in_toc = False
    for paragraph in document_xml.xpath(".//w:p", namespaces=NS):
        text = _paragraph_text(paragraph).strip()
        if text in {"Table of Contents", "目录", "目次"}:
            toc_pages = _toc_pages(report_type, text)
            final_toc_entry = list(toc_pages)[-1]
            in_toc = True
            continue
        if not in_toc:
            continue
        toc_text = _toc_entry_text(text, toc_pages)
        if not toc_text:
            continue
        page = toc_pages[toc_text]
        bookmark = _static_toc_bookmark(report_type, toc_text)
        if bookmark:
            _set_paragraph_text_with_pageref(
                paragraph,
                toc_text,
                bookmark,
                fallback_page=page,
            )
        else:
            _add_right_tab_stop(paragraph)
            _set_paragraph_text(paragraph, f"{toc_text}\t{page}")
        if toc_text == final_toc_entry:
            break


def _apply_estimated_toc_page_numbers(document_xml, report_type: str) -> None:
    toc_entries = _toc_entries_with_paragraphs(document_xml)
    if not toc_entries:
        return

    labels = [label for _, label in toc_entries]
    page_map = _estimate_toc_pages_from_document(document_xml, labels, report_type)
    previous_page = 3
    for paragraph, label in toc_entries:
        page = page_map.get(label, previous_page)
        previous_page = max(previous_page, page)
        _set_toc_paragraph_text_with_page(paragraph, label, str(page))


def _toc_entries_with_paragraphs(document_xml) -> list[tuple[object, str]]:
    entries = []
    for paragraph in _toc_paragraphs(document_xml):
        label = _toc_label_from_paragraph(paragraph)
        if label:
            entries.append((paragraph, label))
    return entries


def _toc_label_from_paragraph(paragraph) -> str:
    field = paragraph.find("w:fldSimple", namespaces=NS)
    if field is not None:
        parts = []
        for child in paragraph:
            if child is field:
                break
            if child.tag == _qn("w:r"):
                parts.append(_paragraph_text(child))
        return "".join(parts).strip()

    text = _paragraph_text(paragraph).strip()
    if not text:
        return ""
    text = re.sub(r"\s*[\t.]+\s*\d+\s*$", "", text)
    return text.strip()


def _estimate_toc_pages_from_document(
    document_xml,
    toc_labels: list[str],
    report_type: str,
) -> dict[str, int]:
    toc_page_count = _estimated_toc_page_count(toc_labels, report_type)
    page = 2 + toc_page_count
    used = 0
    capacity = 42
    page_map: dict[str, int] = {}
    label_set = set(toc_labels)
    started = False
    seen_toc = False
    body = document_xml.find("w:body", namespaces=NS)
    if body is None:
        return {}

    for element in list(body):
        if element.tag == _qn("w:p"):
            text = _paragraph_text(element).strip()
            if text in {"Table of Contents", "目录", "目次"}:
                seen_toc = True
                continue
            if seen_toc and element.xpath(".//w:br[@w:type='page']", namespaces=NS):
                started = True
                continue
        if not started:
            continue

        text = _paragraph_text(element).strip() if element.tag == _qn("w:p") else ""
        units = _estimated_body_element_units(element)
        if text in label_set and used > capacity - 8:
            page += 1
            used = 0
        if text in label_set:
            page_map.setdefault(text, page)

        if element.tag == _qn("w:p") and element.xpath(
            ".//w:br[@w:type='page']",
            namespaces=NS,
        ):
            page += 1
            used = 0
            continue

        if units <= 0:
            continue
        if used and used + units > capacity:
            page += 1
            used = 0
        used += units
        while used > capacity:
            page += 1
            used -= capacity

    return page_map


def _estimated_toc_page_count(toc_labels: list[str], report_type: str) -> int:
    capacity = 22 if report_type == "findings" else 28
    units = 2
    for label in toc_labels:
        wrapped_lines = max(0, (len(label) - 58) // 58)
        units += 1 + wrapped_lines
    return max(1, (units + capacity - 1) // capacity)


def _estimated_body_element_units(element) -> int:
    if element.tag == _qn("w:tbl"):
        rows = element.xpath(".//w:tr", namespaces=NS)
        return 5 + max(1, len(rows)) * 3
    if element.tag != _qn("w:p"):
        return 1

    text = _paragraph_text(element).strip()
    if element.xpath(".//w:drawing", namespaces=NS):
        return 20
    if not text:
        return 1
    if _is_heading_1_text(text):
        return 8
    if _is_heading_2_text(text):
        return 6
    if _is_heading_3_text(text):
        return 4
    if text.startswith(("Table ", "Figure ", "表 ", "图 ", "図 ")):
        return 3
    return 2 + (len(text) + 59) // 60


def _set_toc_paragraph_text_with_page(
    paragraph,
    label: str,
    page: str,
) -> None:
    for child in list(paragraph):
        if child.tag != _qn("w:pPr"):
            paragraph.remove(child)

    run = etree.SubElement(paragraph, _qn("w:r"))
    text = etree.SubElement(run, _qn("w:t"))
    text.text = label

    tab_run = etree.SubElement(paragraph, _qn("w:r"))
    etree.SubElement(tab_run, _qn("w:tab"))

    page_run = etree.SubElement(paragraph, _qn("w:r"))
    page_text = etree.SubElement(page_run, _qn("w:t"))
    page_text.text = page

    _add_right_tab_stop(paragraph)


def _toc_pages(report_type: str, toc_title: str = "Table of Contents") -> dict[str, str]:
    if report_type == "findings":
        if toc_title == "目录":
            return {
                "1. 检测结果汇总": "3",
                "1.1 检测结果统计": "3",
                "2. 检测结果详情": "3",
                "附录 A. 严重等级定义": "5",
            }
        if toc_title == "目次":
            return {
                "1. 検出結果サマリー": "3",
                "1.1 検出結果統計": "3",
                "2. 検出結果詳細": "3",
            }
        return {
            "1. Findings Summary": "3",
            "1.1 Findings Statistics": "3",
            "2. Finding Details": "3",
        }
    if toc_title == "目录":
        return {
            "1. 执行摘要": "3",
            "1.1 评估概览": "3",
            "1.2 风险汇总": "3",
            "1.3 关键检测结果": "4",
            "1.4 主要风险类别": "6",
            "2. 资产概览": "7",
            "2.1 云资产汇总": "7",
            "2.2 按区域分布的资源": "8",
            "3. 检测结果概览": "9",
            "3.1 按服务统计检测结果": "9",
            "3.2 按类别统计检测结果": "10",
            "4. 修复优先级": "11",
            "4.1 优先级 1（需立即处理）": "11",
            "4.2 优先级 2（建议修复）": "12",
            "4.3 优先级 3（持续改进）": "12",
            "5. 建议": "13",
            "附录 A. 评估方法": "13",
            "附录 B. 严重等级定义": "14",
            "附录 C. 免责声明": "14",
        }
    if toc_title == "目次":
        return {
            "1. エグゼクティブサマリー": "3",
            "1.1 評価概要": "3",
            "1.2 リスクサマリー": "3",
            "1.3 主な検出結果": "4",
            "1.4 主なリスクカテゴリ": "6",
            "2. 資産概要": "7",
            "2.1 クラウド資産サマリー": "7",
            "2.2 リージョン別リソース分布": "8",
            "3. 検出結果の概要": "9",
            "3.1 サービス別検出結果": "9",
            "3.2 カテゴリ別検出結果": "10",
            "4. 修復優先度": "11",
            "4.1 優先度 1（即時対応）": "11",
            "4.2 優先度 2（修復推奨）": "12",
            "4.3 優先度 3（継続改善）": "12",
            "5. 推奨事項": "13",
            "付録 A. 評価方法": "13",
            "付録 B. 重大度定義": "14",
            "付録 C. 免責事項": "14",
        }
    return {
        "1. Executive Summary": "3",
        "1.1 Assessment Overview": "3",
        "1.2 Risk Summary": "3",
        "1.3 Key Findings": "4",
        "1.4 Top Risk Categories": "6",
        "2. Asset Overview": "7",
        "2.1 Cloud Asset Summary": "7",
        "2.2 Resource Distribution by Region": "8",
        "3. Findings Overview": "9",
        "3.1 Findings by Service": "9",
        "3.2 Findings by Category": "10",
        "4. Remediation Priorities": "11",
        "4.1 Priority 1 (Immediate Action Required)": "11",
        "4.2 Priority 2 (Remediation Recommended)": "12",
        "4.3 Priority 3 (Continuous Improvement)": "12",
        "5. Recommendations": "13",
        "Appendix A. Assessment Methodology": "13",
        "Appendix B. Severity Definitions": "14",
        "Appendix C. Disclaimer": "14",
    }


def _toc_entry_text(text: str, toc_pages: dict[str, str]) -> str | None:
    for entry in sorted(toc_pages, key=len, reverse=True):
        if not text.startswith(entry):
            continue
        suffix = text[len(entry) :].strip()
        if not suffix or re.fullmatch(r"[.\s\t]*\d+", suffix):
            return entry
    return None


def _add_static_toc_target_bookmarks(document_xml, report_type: str) -> None:
    targets = _toc_bookmark_targets(report_type)
    for paragraph in document_xml.xpath(".//w:p", namespaces=NS):
        text = _paragraph_text(paragraph).strip()
        target = targets.get(text)
        if not target:
            continue
        _add_bookmark_to_paragraph(paragraph, target[0], target[1])


def _static_toc_bookmark(report_type: str, toc_text: str) -> str:
    target = _toc_bookmark_targets(report_type).get(toc_text)
    return target[0] if target else ""


def _toc_bookmark_targets(report_type: str) -> dict[str, tuple[str, int]]:
    if report_type == "findings":
        return {
            "1. Findings Summary": ("toc_findings_summary", 19001),
            "1. 检测结果汇总": ("toc_findings_summary", 19001),
            "1. 发现汇总": ("toc_findings_summary", 19001),
            "1. 検出結果サマリー": ("toc_findings_summary", 19001),
            "1.1 Findings Statistics": ("toc_findings_statistics", 19002),
            "1.1 检测结果统计": ("toc_findings_statistics", 19002),
            "1.1 发现统计": ("toc_findings_statistics", 19002),
            "1.1 検出結果統計": ("toc_findings_statistics", 19002),
            "2. Finding Details": ("toc_finding_details", 19003),
            "2. 检测结果详情": ("toc_finding_details", 19003),
            "2. 发现详情": ("toc_finding_details", 19003),
            "2. 検出結果詳細": ("toc_finding_details", 19003),
            "Appendix A. Severity Definitions": ("toc_findings_appendix_a", 19004),
            "附录 A. 严重等级定义": ("toc_findings_appendix_a", 19004),
            "付録 A. 重大度定義": ("toc_findings_appendix_a", 19004),
        }
    if report_type != "executive":
        return {}
    return {
        "1. Executive Summary": ("toc_executive_summary", 18001),
        "1. 执行摘要": ("toc_executive_summary", 18001),
        "1. エグゼクティブサマリー": ("toc_executive_summary", 18001),
        "1.1 Assessment Overview": ("toc_assessment_overview", 18002),
        "1.1 评估概览": ("toc_assessment_overview", 18002),
        "1.1 評価概要": ("toc_assessment_overview", 18002),
        "1.2 Risk Summary": ("toc_risk_summary", 18003),
        "1.2 风险汇总": ("toc_risk_summary", 18003),
        "1.2 リスクサマリー": ("toc_risk_summary", 18003),
        "1.3 Key Findings": ("toc_key_findings", 18004),
        "1.3 关键检测结果": ("toc_key_findings", 18004),
        "1.3 关键发现": ("toc_key_findings", 18004),
        "1.3 主な検出結果": ("toc_key_findings", 18004),
        "1.4 Top Risk Categories": ("toc_top_risk_categories", 18005),
        "1.4 主要风险类别": ("toc_top_risk_categories", 18005),
        "1.4 主なリスクカテゴリ": ("toc_top_risk_categories", 18005),
        "2. Asset Overview": ("toc_asset_overview", 18006),
        "2. 资产概览": ("toc_asset_overview", 18006),
        "2. 資産概要": ("toc_asset_overview", 18006),
        "2.1 Cloud Asset Summary": ("toc_cloud_asset_summary", 18007),
        "2.1 云资产汇总": ("toc_cloud_asset_summary", 18007),
        "2.1 クラウド資産サマリー": ("toc_cloud_asset_summary", 18007),
        "2.2 Resource Distribution by Region": (
            "toc_resource_distribution_region",
            18008,
        ),
        "2.2 按区域分布的资源": ("toc_resource_distribution_region", 18008),
        "2.2 リージョン別リソース分布": (
            "toc_resource_distribution_region",
            18008,
        ),
        "3. Findings Overview": ("toc_findings_overview", 18009),
        "3. 检测结果概览": ("toc_findings_overview", 18009),
        "3. 发现概览": ("toc_findings_overview", 18009),
        "3. 検出結果の概要": ("toc_findings_overview", 18009),
        "3.1 Findings by Service": ("toc_findings_by_service", 18010),
        "3.1 按服务统计检测结果": ("toc_findings_by_service", 18010),
        "3.1 按服务统计发现": ("toc_findings_by_service", 18010),
        "3.1 サービス別検出結果": ("toc_findings_by_service", 18010),
        "3.2 Findings by Category": ("toc_findings_by_category", 18011),
        "3.2 按类别统计检测结果": ("toc_findings_by_category", 18011),
        "3.2 按类别统计发现": ("toc_findings_by_category", 18011),
        "3.2 カテゴリ別検出結果": ("toc_findings_by_category", 18011),
        "4. Remediation Priorities": ("toc_remediation_priorities", 18012),
        "4. 修复优先级": ("toc_remediation_priorities", 18012),
        "4. 修復優先度": ("toc_remediation_priorities", 18012),
        "4.1 Priority 1 (Immediate Action Required)": ("toc_priority_1", 18013),
        "4.1 优先级 1（需立即处理）": ("toc_priority_1", 18013),
        "4.1 優先度 1（即時対応）": ("toc_priority_1", 18013),
        "4.2 Priority 2 (Remediation Recommended)": ("toc_priority_2", 18014),
        "4.2 优先级 2（建议修复）": ("toc_priority_2", 18014),
        "4.2 優先度 2（修復推奨）": ("toc_priority_2", 18014),
        "4.3 Priority 3 (Continuous Improvement)": ("toc_priority_3", 18015),
        "4.3 优先级 3（持续改进）": ("toc_priority_3", 18015),
        "4.3 優先度 3（継続改善）": ("toc_priority_3", 18015),
        "5. Recommendations": ("toc_recommendations", 18016),
        "5. 建议": ("toc_recommendations", 18016),
        "5. 推奨事項": ("toc_recommendations", 18016),
        "Appendix A. Assessment Methodology": ("toc_appendix_a", 18017),
        "附录 A. 评估方法": ("toc_appendix_a", 18017),
        "付録 A. 評価方法": ("toc_appendix_a", 18017),
        "Appendix B. Severity Definitions": ("toc_appendix_b", 18018),
        "附录 B. 严重等级定义": ("toc_appendix_b", 18018),
        "付録 B. 重大度定義": ("toc_appendix_b", 18018),
        "Appendix C. Disclaimer": ("toc_appendix_c", 18019),
        "附录 C. 免责声明": ("toc_appendix_c", 18019),
        "付録 C. 免責事項": ("toc_appendix_c", 18019),
    }


def _set_paragraph_text_with_pageref(
    paragraph,
    label: str,
    bookmark_name: str,
    fallback_page: str,
) -> None:
    for child in list(paragraph):
        if child.tag != _qn("w:pPr"):
            paragraph.remove(child)

    run = etree.SubElement(paragraph, _qn("w:r"))
    text = etree.SubElement(run, _qn("w:t"))
    text.text = label

    tab_run = etree.SubElement(paragraph, _qn("w:r"))
    etree.SubElement(tab_run, _qn("w:tab"))

    field = etree.SubElement(paragraph, _qn("w:fldSimple"))
    field.set(_qn("w:instr"), f" PAGEREF {bookmark_name} \\h ")
    field.set(_qn("w:dirty"), "true")
    result_run = etree.SubElement(field, _qn("w:r"))
    result_text = etree.SubElement(result_run, _qn("w:t"))
    result_text.text = fallback_page

    _add_right_tab_stop(paragraph)


def _add_bookmark_to_paragraph(
    paragraph,
    name: str,
    bookmark_id: int,
) -> None:
    for bookmark_start in paragraph.xpath(
        f"./w:bookmarkStart[@w:name='{name}']",
        namespaces=NS,
    ):
        paragraph.remove(bookmark_start)
    for bookmark_end in paragraph.xpath(
        f"./w:bookmarkEnd[@w:id='{bookmark_id}']",
        namespaces=NS,
    ):
        paragraph.remove(bookmark_end)

    start = etree.Element(_qn("w:bookmarkStart"))
    start.set(_qn("w:id"), str(bookmark_id))
    start.set(_qn("w:name"), name)
    end = etree.Element(_qn("w:bookmarkEnd"))
    end.set(_qn("w:id"), str(bookmark_id))

    ppr = paragraph.find("w:pPr", namespaces=NS)
    insert_at = 1 if ppr is not None else 0
    paragraph.insert(insert_at, start)
    paragraph.append(end)


def _enable_update_fields_on_open(settings_xml) -> None:
    update_fields = settings_xml.find("w:updateFields", namespaces=NS)
    if update_fields is None:
        update_fields = etree.SubElement(settings_xml, _qn("w:updateFields"))
    update_fields.set(_qn("w:val"), "true")


def _add_right_tab_stop(paragraph) -> None:
    ppr = _get_or_add(paragraph, "w:pPr", first=True)
    tabs = ppr.find("w:tabs", namespaces=NS)
    if tabs is None:
        tabs = etree.SubElement(ppr, _qn("w:tabs"))
    for tab in tabs.findall("w:tab", namespaces=NS):
        tabs.remove(tab)
    tab = etree.SubElement(tabs, _qn("w:tab"))
    tab.set(_qn("w:val"), "right")
    tab.set(_qn("w:leader"), "dot")
    tab.set(_qn("w:pos"), "9360")


def _replace_tables(document_xml, table_data: dict[int, list[list[str]]]) -> None:
    tables = document_xml.xpath(".//w:tbl", namespaces=NS)
    for table_number, rows in table_data.items():
        if table_number > len(tables):
            continue
        _replace_table(tables[table_number - 1], rows)


def _replace_table(table, rows: list[list[str]]) -> None:
    existing_rows = table.xpath("./w:tr", namespaces=NS)
    if not existing_rows:
        return

    header_template = existing_rows[0]
    data_template = existing_rows[1] if len(existing_rows) > 1 else existing_rows[0]
    for row in existing_rows:
        table.remove(row)

    for index, values in enumerate(rows):
        template = header_template if index == 0 else data_template
        row = copy.deepcopy(template)
        _set_row_values(row, values, allow_severity_color=index != 0)
        table.append(row)
    _format_table_geometry(table)


def _format_table_geometry(table) -> None:
    rows = table.xpath("./w:tr", namespaces=NS)
    if not rows:
        return
    first_cells = rows[0].xpath("./w:tc", namespaces=NS)
    column_count = len(first_cells)
    if column_count == 0:
        return
    widths = _table_column_widths(column_count)
    _set_table_width(table, STANDARD_BLOCK_WIDTH_DXA)
    _set_table_grid(table, widths)
    for row in rows:
        cells = row.xpath("./w:tc", namespaces=NS)
        for index, cell in enumerate(cells):
            width = widths[min(index, len(widths) - 1)]
            _set_cell_width(cell, width)
            _set_cell_margins(cell)


def _table_column_widths(column_count: int) -> list[int]:
    ratios_by_count = {
        2: [0.42, 0.58],
        3: [0.45, 0.2, 0.35],
        4: [0.25, 0.32, 0.18, 0.25],
        5: [0.25, 0.25, 0.15, 0.18, 0.17],
    }
    ratios = ratios_by_count.get(column_count)
    if not ratios:
        each = int(STANDARD_BLOCK_WIDTH_DXA / column_count)
        widths = [each] * column_count
        widths[-1] += STANDARD_BLOCK_WIDTH_DXA - sum(widths)
        return widths

    total = sum(ratios)
    widths = [int(STANDARD_BLOCK_WIDTH_DXA * ratio / total) for ratio in ratios]
    widths[-1] += STANDARD_BLOCK_WIDTH_DXA - sum(widths)
    return widths


def _set_table_width(table, width_dxa: int) -> None:
    tbl_pr = table.find("w:tblPr", namespaces=NS)
    if tbl_pr is None:
        tbl_pr = etree.Element(_qn("w:tblPr"))
        table.insert(0, tbl_pr)
    tbl_w = tbl_pr.find("w:tblW", namespaces=NS)
    if tbl_w is None:
        tbl_w = etree.SubElement(tbl_pr, _qn("w:tblW"))
    tbl_w.set(_qn("w:w"), str(width_dxa))
    tbl_w.set(_qn("w:type"), "dxa")

    jc = tbl_pr.find("w:jc", namespaces=NS)
    if jc is None:
        jc = etree.SubElement(tbl_pr, _qn("w:jc"))
    jc.set(_qn("w:val"), "center")

    layout = tbl_pr.find("w:tblLayout", namespaces=NS)
    if layout is None:
        layout = etree.SubElement(tbl_pr, _qn("w:tblLayout"))
    layout.set(_qn("w:type"), "fixed")


def _set_table_borders(table) -> None:
    tbl_pr = _get_or_add(table, "w:tblPr", first=True)
    tbl_borders = tbl_pr.find("w:tblBorders", namespaces=NS)
    if tbl_borders is None:
        tbl_borders = etree.SubElement(tbl_pr, _qn("w:tblBorders"))
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        border = tbl_borders.find(f"w:{edge}", namespaces=NS)
        if border is None:
            border = etree.SubElement(tbl_borders, _qn(f"w:{edge}"))
        _set_border_style(border)

    for cell in table.xpath(".//w:tc", namespaces=NS):
        tc_pr = _get_or_add(cell, "w:tcPr", first=True)
        tc_borders = tc_pr.find("w:tcBorders", namespaces=NS)
        if tc_borders is None:
            tc_borders = etree.SubElement(tc_pr, _qn("w:tcBorders"))
        for edge in ("top", "left", "bottom", "right"):
            border = tc_borders.find(f"w:{edge}", namespaces=NS)
            if border is None:
                border = etree.SubElement(tc_borders, _qn(f"w:{edge}"))
            _set_border_style(border)


def _set_border_style(border) -> None:
    border.set(_qn("w:val"), "single")
    border.set(_qn("w:sz"), "8")
    border.set(_qn("w:space"), "0")
    border.set(_qn("w:color"), "000000")


def _set_table_grid(table, widths: list[int]) -> None:
    tbl_grid = table.find("w:tblGrid", namespaces=NS)
    if tbl_grid is None:
        insert_at = 1 if table.find("w:tblPr", namespaces=NS) is not None else 0
        tbl_grid = etree.Element(_qn("w:tblGrid"))
        table.insert(insert_at, tbl_grid)
    for child in list(tbl_grid):
        tbl_grid.remove(child)
    for width in widths:
        grid_col = etree.SubElement(tbl_grid, _qn("w:gridCol"))
        grid_col.set(_qn("w:w"), str(width))


def _set_cell_width(cell, width_dxa: int) -> None:
    tc_pr = _get_or_add(cell, "w:tcPr", first=True)
    tc_w = tc_pr.find("w:tcW", namespaces=NS)
    if tc_w is None:
        tc_w = etree.SubElement(tc_pr, _qn("w:tcW"))
    tc_w.set(_qn("w:w"), str(width_dxa))
    tc_w.set(_qn("w:type"), "dxa")


def _set_cell_margins(cell, margin_dxa: int = 100) -> None:
    tc_pr = _get_or_add(cell, "w:tcPr", first=True)
    tc_mar = tc_pr.find("w:tcMar", namespaces=NS)
    if tc_mar is None:
        tc_mar = etree.SubElement(tc_pr, _qn("w:tcMar"))
    for side in ("top", "left", "bottom", "right"):
        node = tc_mar.find(f"w:{side}", namespaces=NS)
        if node is None:
            node = etree.SubElement(tc_mar, _qn(f"w:{side}"))
        node.set(_qn("w:w"), str(margin_dxa))
        node.set(_qn("w:type"), "dxa")


def _set_row_values(
    row,
    values: list[str],
    allow_severity_color: bool = True,
) -> None:
    cells = row.xpath("./w:tc", namespaces=NS)
    for index, cell in enumerate(cells):
        value = values[index] if index < len(values) else ""
        _set_cell_text(cell, str(value))
        if allow_severity_color:
            _apply_severity_color(cell, str(value))


def _set_cell_text(cell, value: str) -> None:
    paragraphs = cell.xpath("./w:p", namespaces=NS)
    if paragraphs:
        paragraph = paragraphs[0]
        for extra in paragraphs[1:]:
            cell.remove(extra)
    else:
        paragraph = etree.SubElement(cell, _qn("w:p"))

    runs = paragraph.xpath("./w:r", namespaces=NS)
    if runs:
        run = runs[0]
        for extra in runs[1:]:
            paragraph.remove(extra)
    else:
        run = etree.SubElement(paragraph, _qn("w:r"))

    text_nodes = run.xpath(".//w:t", namespaces=NS)
    if text_nodes:
        text = text_nodes[0]
        for extra in text_nodes[1:]:
            extra.getparent().remove(extra)
    else:
        text = etree.SubElement(run, _qn("w:t"))

    if value.strip() != value:
        text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    text.text = value


def _normalize_table_severity_text_colors(document_xml) -> None:
    for table in document_xml.xpath(".//w:tbl", namespaces=NS):
        rows = table.xpath("./w:tr", namespaces=NS)
        for row_index, row in enumerate(rows):
            for cell in row.xpath("./w:tc", namespaces=NS):
                if row_index == 0:
                    _set_cell_text_color(cell, "FFFFFF")
                    continue
                if _severity_from_label(_cell_text(cell).strip()):
                    _apply_severity_color(cell, _cell_text(cell).strip())


def _cell_text(cell) -> str:
    return "".join(cell.xpath(".//w:t/text()", namespaces=NS))


def _set_cell_text_color(cell, color_value: str) -> None:
    for run in cell.xpath(".//w:r", namespaces=NS):
        properties = run.find("w:rPr", namespaces=NS)
        if properties is None:
            properties = etree.Element(_qn("w:rPr"))
            run.insert(0, properties)
        color = properties.find("w:color", namespaces=NS)
        if color is None:
            color = etree.SubElement(properties, _qn("w:color"))
        color.set(_qn("w:val"), color_value)


def _apply_severity_color(cell, value: str) -> None:
    severity = _severity_from_label(value)
    if severity not in SEVERITY_COLORS:
        return
    run = cell.find(".//w:r", namespaces=NS)
    if run is None:
        return
    properties = run.find("w:rPr", namespaces=NS)
    if properties is None:
        properties = etree.Element(_qn("w:rPr"))
        run.insert(0, properties)
    bold = properties.find("w:b", namespaces=NS)
    if bold is None:
        etree.SubElement(properties, _qn("w:b"))
    color = properties.find("w:color", namespaces=NS)
    if color is None:
        color = etree.SubElement(properties, _qn("w:color"))
    color.set(_qn("w:val"), SEVERITY_COLORS[severity])


def _chart_paths_by_figure(source: zipfile.ZipFile, document_xml) -> dict[str, str]:
    rels_xml = etree.fromstring(source.read("word/_rels/document.xml.rels"))
    rels = {
        element.get("Id"): element.get("Target")
        for element in rels_xml.findall(f"{{{REL_NS}}}Relationship")
    }
    chart_paths = {}
    last_figure = None
    body_children = document_xml.xpath("./w:body/*", namespaces=NS)
    for element in body_children:
        if element.tag == _qn("w:p"):
            text = _paragraph_text(element).strip()
            if text.startswith("Figure ") or text in CANONICAL_FIGURE_TITLES:
                last_figure = text
            chart = element.find(".//c:chart", namespaces=NS)
            if chart is not None and last_figure:
                relationship_id = chart.get(_qn("r:id"))
                if relationship_id in rels:
                    chart_paths[last_figure] = rels[relationship_id]
                    canonical = CANONICAL_FIGURE_TITLES.get(last_figure)
                    if canonical:
                        chart_paths[canonical] = rels[relationship_id]
                last_figure = None
    return chart_paths


def _replace_chart_series(chart_xml, series_data: list[tuple[str, list[str], list[int]]]) -> None:
    chart_type = _first_chart_type(chart_xml)
    if chart_type is None:
        return
    existing_series = chart_type.xpath("./c:ser", namespaces=NS)
    if not existing_series:
        return
    insert_at = list(chart_type).index(existing_series[0])
    template = existing_series[0]
    for series in existing_series:
        chart_type.remove(series)
    for offset, (name, categories, values) in enumerate(series_data):
        series = copy.deepcopy(template)
        _set_series_index(series, offset)
        _set_series_title(series, name)
        _set_series_categories(series, categories)
        _set_series_values(series, values)
        _set_series_color(series, name, categories)
        chart_type.insert(insert_at + offset, series)


def _first_chart_type(chart_xml):
    plot_area = chart_xml.find(".//c:plotArea", namespaces=NS)
    if plot_area is None:
        return None
    for child in plot_area:
        if child.tag.endswith("Chart") and child.xpath("./c:ser", namespaces=NS):
            return child
    return None


def _set_series_index(series, index: int) -> None:
    for tag in ("idx", "order"):
        element = series.find(f"c:{tag}", namespaces=NS)
        if element is not None:
            element.set("val", str(index))


def _set_series_title(series, title: str) -> None:
    tx = series.find("c:tx", namespaces=NS)
    if tx is None:
        tx = etree.SubElement(series, _qn("c:tx"))
    cache = tx.find(".//c:strCache", namespaces=NS)
    if cache is not None:
        _set_cache_points(cache, [title], numeric=False)
        return
    value = tx.find(".//c:v", namespaces=NS)
    if value is None:
        str_ref = etree.SubElement(tx, _qn("c:strRef"))
        cache = etree.SubElement(str_ref, _qn("c:strCache"))
        _set_cache_points(cache, [title], numeric=False)
    else:
        value.text = title


def _set_series_categories(series, categories: list[str]) -> None:
    category = series.find("c:cat", namespaces=NS)
    if category is None:
        category = etree.SubElement(series, _qn("c:cat"))
    cache = category.find(".//c:strCache", namespaces=NS)
    if cache is None:
        str_ref = category.find("c:strRef", namespaces=NS)
        if str_ref is None:
            str_ref = etree.SubElement(category, _qn("c:strRef"))
        cache = etree.SubElement(str_ref, _qn("c:strCache"))
    _set_cache_points(cache, categories, numeric=False)


def _set_series_values(series, values: list[int]) -> None:
    value = series.find("c:val", namespaces=NS)
    if value is None:
        value = etree.SubElement(series, _qn("c:val"))
    cache = value.find(".//c:numCache", namespaces=NS)
    if cache is None:
        num_ref = value.find("c:numRef", namespaces=NS)
        if num_ref is None:
            num_ref = etree.SubElement(value, _qn("c:numRef"))
        cache = etree.SubElement(num_ref, _qn("c:numCache"))
    _set_cache_points(cache, values, numeric=True)


def _set_series_color(series, name: str, categories: list[str]) -> None:
    severity = _severity_from_label(name)
    if severity:
        _set_shape_color(series, SEVERITY_COLORS[severity])

    for index, category in enumerate(categories):
        severity = _severity_from_label(category)
        if severity:
            _set_data_point_color(series, index, SEVERITY_COLORS[severity])


def _severity_from_label(value: str) -> str | None:
    normalized = str(value or "").strip().lower()
    if normalized in SEVERITY_COLORS:
        return normalized
    if value in SEVERITY_BY_LABEL:
        return SEVERITY_BY_LABEL[value]
    for report_text in REPORT_DOCX_TEXT.values():
        for severity, label in report_text.severity.items():
            if value == label:
                return severity
    return None


def _set_data_point_color(series, index: int, color: str) -> None:
    point = None
    for existing in series.findall("c:dPt", namespaces=NS):
        idx = existing.find("c:idx", namespaces=NS)
        if idx is not None and idx.get("val") == str(index):
            point = existing
            break
    if point is None:
        point = etree.Element(_qn("c:dPt"))
        idx = etree.SubElement(point, _qn("c:idx"))
        idx.set("val", str(index))
        insert_at = 0
        for candidate in ("c:idx", "c:order", "c:tx", "c:spPr", "c:cat", "c:val"):
            element = series.find(candidate, namespaces=NS)
            if element is not None:
                insert_at = list(series).index(element) + 1
        series.insert(insert_at, point)
    _set_shape_color(point, color)


def _set_shape_color(element, color: str) -> None:
    properties = element.find("c:spPr", namespaces=NS)
    if properties is None:
        properties = etree.Element(_qn("c:spPr"))
        _insert_chart_shape_properties(element, properties)
    fill = properties.find("a:solidFill", namespaces=NS)
    if fill is None:
        fill = etree.SubElement(properties, _qn("a:solidFill"))
    for child in list(fill):
        fill.remove(child)
    rgb = etree.SubElement(fill, _qn("a:srgbClr"))
    rgb.set("val", color)


def _insert_chart_shape_properties(element, properties) -> None:
    for tag in ("c:cat", "c:val", "c:extLst"):
        next_element = element.find(tag, namespaces=NS)
        if next_element is not None:
            element.insert(list(element).index(next_element), properties)
            return
    element.append(properties)


def _set_cache_points(cache, values: list, numeric: bool) -> None:
    for point in cache.xpath("./c:pt", namespaces=NS):
        cache.remove(point)
    count = cache.find("c:ptCount", namespaces=NS)
    if count is None:
        count = etree.Element(_qn("c:ptCount"))
        cache.insert(0, count)
    count.set("val", str(len(values)))
    for index, value in enumerate(values):
        point = etree.SubElement(cache, _qn("c:pt"))
        point.set("idx", str(index))
        v = etree.SubElement(point, _qn("c:v"))
        v.text = str(int(value) if numeric else value)


def _paragraph_text(paragraph) -> str:
    return "".join(paragraph.xpath(".//w:t/text()", namespaces=NS))


def _set_paragraph_text(paragraph, value: str) -> None:
    runs = paragraph.xpath("./w:r", namespaces=NS)
    if not runs:
        run = etree.SubElement(paragraph, _qn("w:r"))
        text = etree.SubElement(run, _qn("w:t"))
        if value.strip() != value or "\t" in value:
            text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        text.text = value
        return
    first_run = runs[0]
    texts = first_run.xpath(".//w:t", namespaces=NS)
    first_text = texts[0] if texts else None
    if first_text is None:
        first_text = etree.SubElement(first_run, _qn("w:t"))
    for extra_text in texts[1:]:
        extra_text.getparent().remove(extra_text)
    if value.strip() != value or "\t" in value:
        first_text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    first_text.text = value
    for run in runs[1:]:
        paragraph.remove(run)


def _replace_paragraph_with_labeled_items(
    paragraph,
    items: list[tuple[str, str]],
    container: list | None = None,
) -> None:
    parent = paragraph.getparent()
    current = paragraph
    for index, (label, value) in enumerate(items):
        target = paragraph if index == 0 else copy.deepcopy(paragraph)
        if index > 0:
            if parent is not None:
                parent.insert(parent.index(current) + 1, target)
                current = target
            elif container is not None and current in container:
                container.insert(container.index(current) + 1, target)
                current = target
        _set_labeled_paragraph_text(target, label, value)
        _set_paragraph_spacing(target, before=80 if index else 0, after=80)


def _set_labeled_paragraph_text(paragraph, label: str, value: str) -> None:
    for child in list(paragraph):
        if child.tag != _qn("w:pPr"):
            paragraph.remove(child)

    label_run = etree.SubElement(paragraph, _qn("w:r"))
    label_properties = etree.SubElement(label_run, _qn("w:rPr"))
    etree.SubElement(label_properties, _qn("w:b"))
    label_text = etree.SubElement(label_run, _qn("w:t"))
    label_text.text = f"{label}: "

    value_run = etree.SubElement(paragraph, _qn("w:r"))
    value_text = etree.SubElement(value_run, _qn("w:t"))
    if value.strip() != value:
        value_text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    value_text.text = value


def _set_paragraph_spacing(
    paragraph,
    before: int = 0,
    after: int = 0,
    line: int | None = None,
    line_rule: str | None = None,
) -> None:
    paragraph_properties = _get_or_add(paragraph, "w:pPr", first=True)
    spacing = paragraph_properties.find("w:spacing", namespaces=NS)
    if spacing is None:
        spacing = etree.SubElement(paragraph_properties, _qn("w:spacing"))
    spacing.set(_qn("w:before"), str(before))
    spacing.set(_qn("w:after"), str(after))
    if line is not None:
        spacing.set(_qn("w:line"), str(line))
    if line_rule is not None:
        spacing.set(_qn("w:lineRule"), line_rule)


def _xml_bytes(xml) -> bytes:
    return etree.tostring(
        xml,
        xml_declaration=True,
        encoding="UTF-8",
        standalone=True,
    )


def _qn(tag: str) -> str:
    prefix, name = tag.split(":")
    return f"{{{NS[prefix]}}}{name}"


def _get_or_add(parent, tag: str, first: bool = False):
    child = parent.find(tag, namespaces=NS)
    if child is not None:
        return child
    child = etree.Element(_qn(tag))
    if first:
        parent.insert(0, child)
    else:
        parent.append(child)
    return child
