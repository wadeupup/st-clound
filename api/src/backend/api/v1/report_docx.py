import copy
import io
import re
import zipfile
from collections import Counter, defaultdict
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

EXECUTIVE_TEMPLATE = (
    Path(__file__).resolve().parent
    / "report_templates"
    / "en"
    / "executive_report"
    / "executive_report-template.docx"
)
FINDINGS_TEMPLATE = (
    Path(__file__).resolve().parent
    / "report_templates"
    / "en"
    / "findings_report"
    / "Findings Report.docx"
)


def build_english_executive_report_docx(
    scan,
    rows: list[dict],
    findings: list,
    summary: dict,
    template_path: Path | None = None,
) -> bytes:
    """Build the English Executive Word report from exported scan data."""
    template = template_path or EXECUTIVE_TEMPLATE
    data = _build_executive_data(scan, rows, findings, summary)

    with zipfile.ZipFile(template, "r") as source:
        document_xml = etree.fromstring(source.read("word/document.xml"))
        chart_paths = _chart_paths_by_figure(source, document_xml)

        _replace_paragraph_text(document_xml, data["paragraphs"])
        _replace_tables(document_xml, data["tables"])
        _format_generated_layout(document_xml, report_type="executive")

        replacements = {"word/document.xml": _xml_bytes(document_xml)}
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
            for item in source.infolist():
                content = replacements.get(item.filename)
                if content is None:
                    content = source.read(item.filename)
                target.writestr(item, content)

    return output.getvalue()


def build_english_findings_report_docx(
    scan,
    rows: list[dict],
    findings: list,
    summary: dict,
    template_path: Path | None = None,
) -> bytes:
    """Build the English Findings Word report from exported scan data."""
    template = template_path or FINDINGS_TEMPLATE
    data = _build_findings_data(scan, rows, findings, summary)

    with zipfile.ZipFile(template, "r") as source:
        document_xml = etree.fromstring(source.read("word/document.xml"))
        chart_paths = _chart_paths_by_figure(source, document_xml)

        _replace_paragraph_text(document_xml, data["paragraphs"])
        _replace_tables(document_xml, data["tables"])
        _replace_findings_detail_blocks(document_xml, data["findings"])
        _replace_paragraph_text(
            document_xml,
            {"2.1 Finding {{finding_number}}3": "2.1 Finding Details"},
        )
        _prune_findings_toc(document_xml)
        _format_generated_layout(document_xml, report_type="findings")

        replacements = {"word/document.xml": _xml_bytes(document_xml)}
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
            for item in source.infolist():
                content = replacements.get(item.filename)
                if content is None:
                    content = source.read(item.filename)
                target.writestr(item, content)

    return output.getvalue()


def _build_executive_data(scan, rows: list[dict], findings: list, summary: dict) -> dict:
    unique_rows = _unique_finding_rows(rows)
    risk_rows = {
        uid: row for uid, row in unique_rows.items() if row.get("status") == "FAIL"
    }
    resources = _unique_resources(rows)
    severity_counts = Counter(row.get("severity") or "" for row in risk_rows.values())
    status_counts = Counter(row.get("status") or "" for row in unique_rows.values())
    region_counts = _count_resources_by(resources.values(), "region")
    resource_type_counts = _count_resources_by(resources.values(), "type")
    category_by_uid = _category_by_finding_uid(findings)
    category_counts = Counter(
        category_by_uid.get(uid, "Uncategorized") for uid in risk_rows
    )
    service_severity = _severity_matrix(risk_rows.values(), "service")

    top_risk_rows = _top_risk_rows(risk_rows, category_by_uid)
    critical_rows = [row for row in top_risk_rows if row["severity"] == "critical"]
    high_rows = [row for row in top_risk_rows if row["severity"] == "high"]

    return {
        "paragraphs": {
            "Assessment Name: {{assessment_name}}": f"Assessment Name: {_scan_name(scan)}",
            "Cloud Provider: {{cloud_provider}}": f"Cloud Provider: {_provider_name(scan)}",
            "Account ID: {{account_id}}": f"Account ID: {_provider_uid(scan)}",
            "Assessment Date: {{assessment_date}}": (
                f"Assessment Date: {_assessment_date(scan, summary)}"
            ),
            "Enable MFA for all IAM users with console access.": _recommendation_line(
                top_risk_rows, 0, "Remediate the highest-severity failed findings first."
            ),
            "Enable CloudTrail logging across all AWS regions.": _recommendation_line(
                top_risk_rows, 1, "Prioritize logging, identity, and data protection controls."
            ),
            "Review privileged IAM permissions.": _recommendation_line(
                top_risk_rows, 2, "Review privileged access and exposed resources."
            ),
            "Implement centralized log monitoring.": (
                "Track medium-severity findings through a short-term remediation plan."
            ),
            "Perform periodic IAM access reviews.": (
                "Review recurring services and categories with repeated failed findings."
            ),
            "Strengthen account activity alerting.": (
                "Use scan results to drive alerting and control validation."
            ),
            "Adopt Zero Trust access controls.": (
                "Adopt continuous CSPM monitoring and periodic access reviews."
            ),
            "Implement continuous CSPM monitoring.": (
                "Integrate report generation into recurring security operations."
            ),
            "Integrate cloud security findings into the incident response process.": (
                "Route high-priority findings into the incident response workflow."
            ),
            "Establish compliance-driven cloud governance.": (
                "Use trend and compliance modules once reliable historical and "
                "compliance data are available."
            ),
        },
        "tables": {
            1: [
                ["Item", "Value"],
                ["Assessment Name", _scan_name(scan)],
                ["Cloud Provider", _provider_name(scan)],
                ["Account ID", _provider_uid(scan)],
                ["Assessment Date", _assessment_date(scan, summary)],
                ["Assessment Scope", f"{_provider_name(scan)} Cloud Security Assessment"],
            ],
            2: [["Severity", "Count"]]
            + [
                [SEVERITY_LABELS[severity], str(severity_counts.get(severity, 0))]
                for severity in SEVERITY_ORDER
            ],
            3: _finding_table(["Finding", "Affected Assets", "Risk"], critical_rows),
            4: _finding_table(["Finding", "Affected Assets", "Risk"], high_rows),
            5: _counter_table("Category", "Findings", category_counts),
            6: _counter_table("Resource Type", "Count", resource_type_counts),
            7: _counter_table("Region", "Resource Count", region_counts),
            8: _service_severity_table(service_severity),
            9: _counter_table("Category", "Findings", category_counts),
            10: _priority_table(top_risk_rows, {"critical", "high"}),
            11: _priority_table(top_risk_rows, {"medium"}),
            12: _priority_table(top_risk_rows, {"low", "informational"}),
        },
        "charts": {
            "Figure 1-1 Risk Distribution": [
                (
                    "Count",
                    [SEVERITY_LABELS[s] for s in SEVERITY_ORDER],
                    [severity_counts.get(s, 0) for s in SEVERITY_ORDER],
                )
            ],
            "Figure 1-2 Risk Categories": [
                ("Findings", *_chart_categories_values(category_counts))
            ],
            "Figure 2-1 Asset Distribution": [
                ("Resource Count", *_chart_categories_values(resource_type_counts))
            ],
            "Figure 2-2 Resource Distribution by Region": [
                ("Resource Count", *_chart_categories_values(region_counts))
            ],
            "Figure 3-1 Findings by Service": _service_severity_chart(service_severity),
            "Figure 3-2 Findings by Category": [
                ("Findings", *_chart_categories_values(category_counts))
            ],
        },
        "status_counts": status_counts,
    }


def _build_findings_data(scan, rows: list[dict], findings: list, summary: dict) -> dict:
    groups = _finding_detail_groups(rows, findings)
    severity_counts = Counter(group["severity"] for group in groups)

    return {
        "paragraphs": {
            "Assessment Name: {{assessment_name}}": f"Assessment Name: {_scan_name(scan)}",
            "Cloud Provider: {{cloud_provider}}": f"Cloud Provider: {_provider_name(scan)}",
            "Account ID: {{account_id}}": f"Account ID: {_provider_uid(scan)}",
            "Assessment Date: {{assessment_date}}": (
                f"Assessment Date: {_assessment_date(scan, summary)}"
            ),
        },
        "tables": {
            1: [["Severity", "Count"]]
            + [
                [SEVERITY_LABELS[severity], str(severity_counts.get(severity, 0))]
                for severity in ["critical", "high", "medium", "low"]
            ],
        },
        "charts": {
            "Figure 1-1 Findings Distribution": [
                (
                    "Count",
                    [SEVERITY_LABELS[s] for s in ["critical", "high", "medium", "low"]],
                    [severity_counts.get(s, 0) for s in ["critical", "high", "medium", "low"]],
                )
            ],
        },
        "findings": groups,
    }


def _finding_detail_groups(rows: list[dict], findings: list) -> list[dict]:
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
                    "type": row.get("resource_type") or "Unknown",
                    "region": row.get("region") or "global",
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
            "title": group["check_title"] or group["check_id"] or f"Finding {index:03d}",
            "severity_label": SEVERITY_LABELS.get(
                group["severity"], _label(group["severity"])
            ),
            "priority": _priority_for_severity(group["severity"]),
            "category": _category_from_metadata(metadata, group["service"]),
            "resources": resources,
            "summary": _finding_summary(group),
            "actions": _remediation_actions(group),
            "references": _finding_references(metadata),
        }
        details.append(detail)

    if details:
        return details

    return [
        {
            "number": 1,
            "finding_id": "F-001",
            "check_id": "No failed findings",
            "check_title": "No failed findings",
            "title": "No failed findings",
            "severity": "informational",
            "severity_label": "Informational",
            "priority": "P3",
            "category": "None",
            "service": "None",
            "resources": [],
            "summary": "No failed findings are available in the scan data.",
            "actions": ["Continue periodic CSPM monitoring."],
            "references": ["No external reference is available in scan data."],
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


def _category_from_metadata(metadata: dict, fallback: str) -> str:
    categories = metadata.get("categories") or []
    if isinstance(categories, str):
        return _label(categories)
    if categories:
        return _label(categories[0])
    return _label(metadata.get("servicename") or fallback or "Uncategorized")


def _priority_for_severity(severity: str) -> str:
    if severity in {"critical", "high"}:
        return "P1"
    if severity == "medium":
        return "P2"
    return "P3"


def _finding_summary(group: dict) -> str:
    parts = []
    if group.get("description"):
        parts.append(f"Description: {_clean_markdown(group['description'])}")
    if group.get("risk"):
        parts.append(f"Risk: {_clean_markdown(group['risk'])}")
    if group.get("status_extended"):
        parts.append(f"Current status: {_clean_markdown(group['status_extended'])}")
    if not parts:
        parts.append("No narrative details are available in the scan data.")
    return _short_text(" ".join(parts), 1200)


def _remediation_actions(group: dict) -> list[str]:
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
            f"Review and remediate {group.get('check_title') or group.get('check_id') or 'this finding'}."
        ]
    return [_short_text(line, 220) for line in lines[:4]]


def _finding_references(metadata: dict) -> list[str]:
    references = []
    recommendation = metadata.get("remediation", {}).get("recommendation", {})
    for value in [
        recommendation.get("url"),
        metadata.get("relatedurl"),
        *(metadata.get("additionalurls") or []),
    ]:
        if value and value not in references:
            references.append(str(value))
    return references[:3] or ["No external reference is available in scan data."]


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


def _count_by(rows, field: str) -> Counter:
    return Counter(_label(row.get(field) or "Unknown") for row in rows)


def _count_resources_by(resources, field: str) -> Counter:
    if field == "region":
        return Counter(str(resource.get(field) or "global") for resource in resources)
    return Counter(_label(resource.get(field) or "Unknown") for resource in resources)


def _severity_matrix(rows, field: str) -> dict[str, Counter]:
    matrix = defaultdict(Counter)
    for row in rows:
        key = _label(row.get(field) or "Unknown")
        severity = row.get("severity")
        if severity in SEVERITY_ORDER:
            matrix[key][severity] += 1
    return dict(matrix)


def _finding_table(headers: list[str], rows: list[dict], limit: int = 8) -> list[list[str]]:
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
        table.append(["No findings", "0", "No findings in this severity level."])
    return table


def _counter_table(
    label: str, count_label: str, counter: Counter, limit: int = 8
) -> list[list[str]]:
    table = [[label, count_label]]
    for key, value in counter.most_common(limit):
        table.append([key, str(value)])
    if len(table) == 1:
        table.append(["None", "0"])
    return table


def _service_severity_table(matrix: dict[str, Counter], limit: int = 8) -> list[list[str]]:
    services = sorted(
        matrix,
        key=lambda service: sum(matrix[service].values()),
        reverse=True,
    )[:limit]
    table = [["Service", "Critical", "High", "Medium", "Low"]]
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
        table.append(["None", "0", "0", "0", "0"])
    return table


def _priority_table(rows: list[dict], severities: set[str], limit: int = 8) -> list[list[str]]:
    table = [["Finding", "Severity", "Assets"]]
    for row in [row for row in rows if row.get("severity") in severities][:limit]:
        table.append(
            [
                row.get("check_title") or row.get("check_id") or "",
                SEVERITY_LABELS.get(row.get("severity"), row.get("severity") or ""),
                str(row.get("affected_assets") or 1),
            ]
        )
    if len(table) == 1:
        table.append(["No findings", "", "0"])
    return table


def _service_severity_chart(matrix: dict[str, Counter], limit: int = 8) -> list[tuple]:
    services = sorted(
        matrix,
        key=lambda service: sum(matrix[service].values()),
        reverse=True,
    )[:limit]
    if not services:
        services = ["None"]
    return [
        (
            SEVERITY_LABELS[severity],
            services,
            [matrix.get(service, Counter()).get(severity, 0) for service in services],
        )
        for severity in ["critical", "high", "medium", "low"]
    ]


def _chart_categories_values(counter: Counter, limit: int = 8) -> tuple[list[str], list[int]]:
    items = counter.most_common(limit)
    if not items:
        return ["None"], [0]
    categories, values = zip(*items)
    return list(categories), list(values)


def _scan_name(scan) -> str:
    return str(getattr(scan, "name", "") or getattr(scan, "id", "Cloud Security Assessment"))


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


def _recommendation_line(rows: list[dict], index: int, fallback: str) -> str:
    if index >= len(rows):
        return fallback
    row = rows[index]
    title = row.get("check_title") or row.get("check_id") or "security finding"
    return f"Remediate {title}."


def _label(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return "Unknown"

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


def _replace_findings_detail_blocks(document_xml, details: list[dict]) -> None:
    body = document_xml.find("w:body", namespaces=NS)
    if body is None:
        return
    children = list(body)
    start = _body_paragraph_index(children, "2.1 Finding {{finding_number}}")
    end = _body_paragraph_index(children, "Appendix A. Severity Definitions")
    if start is None or end is None or start >= end:
        return

    template_block = children[start:end]
    for element in template_block:
        body.remove(element)

    insert_at = start
    for detail in details:
        block = [copy.deepcopy(element) for element in template_block]
        _populate_finding_block(block, detail)
        block = [element for element in block if element.get("data-delete") != "1"]
        for offset, element in enumerate(block):
            body.insert(insert_at + offset, element)
        insert_at += len(block)


def _body_paragraph_index(children: list, text: str) -> int | None:
    for index, element in enumerate(children):
        if element.tag == _qn("w:p") and _paragraph_text(element).strip() == text:
            return index
    return None


def _prune_findings_toc(document_xml) -> None:
    remove_entries = {
        "2.1 Finding Details",
        "2.1 Finding {{finding_number}}",
        "2.1.1 Overview",
        "2.1.2 Executive Summary",
        "2.1.3 Affected Resources",
        "2.1.4 Remediation Guidance",
        "2.1.5 References",
        "Appendix A. Severity Definitions",
    }
    in_toc = False
    for paragraph in list(document_xml.xpath(".//w:p", namespaces=NS)):
        text = _paragraph_text(paragraph).strip()
        if text == "Table of Contents":
            in_toc = True
            continue
        if in_toc and text == "1. Findings Summary":
            break
        if not in_toc:
            continue
        for entry in remove_entries:
            if text.startswith(entry):
                _remove_paragraph(paragraph)
                break


def _populate_finding_block(block: list, detail: dict) -> None:
    overview_rows = [
        ["Field", "Value"],
        ["Finding ID", detail["finding_id"]],
        ["Check ID", detail["check_id"]],
        ["Check Title", detail["check_title"]],
        ["Severity", detail["severity_label"]],
        ["Priority", detail["priority"]],
        ["Category", detail["category"]],
        ["Service", _label(detail["service"])],
        ["Status", "Open"],
        ["Affected Resources", str(len(detail["resources"]))],
    ]
    resource_rows = [["Resource Name", "Resource Type", "Region", "Service", "Account ID"]]
    for resource in detail["resources"][:20]:
        resource_rows.append(
            [
                _short_text(resource.get("name") or resource.get("uid") or "", 80),
                _label(resource.get("type") or "Unknown"),
                resource.get("region") or "global",
                _label(resource.get("service") or detail.get("service") or "Unknown"),
                _account_id_from_resource(resource.get("uid") or ""),
            ]
        )
    if len(resource_rows) == 1:
        resource_rows.append(["No resource", "Unknown", "global", _label(detail["service"]), ""])

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
        "Enable CloudTrail.",
        "Enable multi-region logging.",
        "Store logs centrally in S3.",
        "Configure log monitoring alerts.",
    ]
    reference_placeholders = ["AWS Documentation", "CIS Benchmark", "Vendor Guidance"]
    actions = detail["actions"]
    references = detail["references"]

    for paragraph in list(paragraphs):
        text = _paragraph_text(paragraph).strip()
        replacements = {
            "2.1 Finding {{finding_number}}": (
                f"2.{detail['number']} Finding {detail['finding_id']} - "
                f"{_short_text(detail['title'], 90)}"
            ),
            "2.1.1 Overview": f"2.{detail['number']}.1 Overview",
            "2.1.2 Executive Summary": f"2.{detail['number']}.2 Executive Summary",
            "2.1.3 Affected Resources": f"2.{detail['number']}.3 Affected Resources",
            "2.1.4 Remediation Guidance": f"2.{detail['number']}.4 Remediation Guidance",
            "2.1.5 References": f"2.{detail['number']}.5 References",
            "Table 2-1 Finding Overview": (
                f"Table 2-{detail['number'] * 2 - 1} Finding Overview"
            ),
            "Table 2-2 Affected Resources": (
                f"Table 2-{detail['number'] * 2} Affected Resources"
            ),
        }
        if text in replacements:
            _set_paragraph_text(paragraph, replacements[text])
            continue
        if text.startswith("CloudTrail logging is not enabled"):
            _set_paragraph_text(paragraph, detail["summary"])
            continue
        if text in action_placeholders:
            index = action_placeholders.index(text)
            if index < len(actions):
                _set_paragraph_text(paragraph, actions[index])
            else:
                _remove_paragraph(paragraph)
            continue
        if text in reference_placeholders:
            index = reference_placeholders.index(text)
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


def _account_id_from_resource(resource_uid: str) -> str:
    match = re.search(r":(\d{12}):", resource_uid or "")
    if match:
        return match.group(1)
    match = re.search(r"\b\d{12}\b", resource_uid or "")
    return match.group(0) if match else ""


def _format_generated_layout(document_xml, report_type: str) -> None:
    _center_caption_paragraphs(document_xml)
    _add_static_toc_page_numbers(document_xml, report_type)


def _center_caption_paragraphs(document_xml) -> None:
    for paragraph in document_xml.xpath(".//w:p", namespaces=NS):
        text = _paragraph_text(paragraph).strip()
        if not text.startswith(("Table ", "Figure ")):
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
    toc_pages = _toc_pages(report_type)
    final_toc_entry = list(toc_pages)[-1]
    in_toc = False
    for paragraph in document_xml.xpath(".//w:p", namespaces=NS):
        text = _paragraph_text(paragraph).strip()
        if text == "Table of Contents":
            in_toc = True
            continue
        if not in_toc:
            continue
        toc_text = _toc_entry_text(text, toc_pages)
        if not toc_text:
            continue
        page = toc_pages[toc_text]
        _add_right_tab_stop(paragraph)
        _set_paragraph_text(paragraph, f"{toc_text}\t{page}")
        if toc_text == final_toc_entry:
            break


def _toc_pages(report_type: str) -> dict[str, str]:
    if report_type == "findings":
        return {
            "1. Findings Summary": "3",
            "1.1 Findings Statistics": "3",
            "2. Finding Details": "3",
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
        _set_row_values(row, values)
        table.append(row)


def _set_row_values(row, values: list[str]) -> None:
    cells = row.xpath("./w:tc", namespaces=NS)
    for index, cell in enumerate(cells):
        value = values[index] if index < len(values) else ""
        _set_cell_text(cell, str(value))
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


def _apply_severity_color(cell, value: str) -> None:
    severity = value.lower()
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
            if text.startswith("Figure "):
                last_figure = text
            chart = element.find(".//c:chart", namespaces=NS)
            if chart is not None and last_figure:
                relationship_id = chart.get(_qn("r:id"))
                if relationship_id in rels:
                    chart_paths[last_figure] = rels[relationship_id]
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
    severity = SEVERITY_BY_LABEL.get(name)
    if severity:
        _set_shape_color(series, SEVERITY_COLORS[severity])

    for index, category in enumerate(categories):
        severity = SEVERITY_BY_LABEL.get(category)
        if severity:
            _set_data_point_color(series, index, SEVERITY_COLORS[severity])


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
