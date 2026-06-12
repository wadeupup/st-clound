import zipfile
from datetime import datetime, timezone
from io import BytesIO
from types import SimpleNamespace

from lxml import etree

from api.v1.report_docx import (
    SEVERITY_COLORS,
    build_executive_report_docx,
    build_english_executive_report_docx,
    build_english_findings_report_docx,
    build_findings_report_docx,
)

WORD_NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}


def _document_text(docx_bytes: bytes) -> str:
    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        document = etree.fromstring(docx.read("word/document.xml"))
    return " ".join(document.xpath(".//w:t/text()", namespaces=WORD_NS))


def _paragraph_texts(docx_bytes: bytes) -> list[str]:
    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        document = etree.fromstring(docx.read("word/document.xml"))
    return [
        "".join(paragraph.xpath(".//w:t/text()", namespaces=WORD_NS))
        for paragraph in document.xpath(".//w:p", namespaces=WORD_NS)
    ]


def _first_table_width(docx_bytes: bytes) -> str | None:
    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        document = etree.fromstring(docx.read("word/document.xml"))
    table_width = document.find(".//w:tbl/w:tblPr/w:tblW", namespaces=WORD_NS)
    if table_width is None:
        return None
    return table_width.get(f"{{{WORD_NS['w']}}}w")


def _table_row_text_colors(
    docx_bytes: bytes,
    table_index: int,
    row_index: int,
) -> list[str]:
    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        document = etree.fromstring(docx.read("word/document.xml"))
    tables = document.xpath(".//w:tbl", namespaces=WORD_NS)
    rows = tables[table_index].xpath("./w:tr", namespaces=WORD_NS)
    return [
        color.get(f"{{{WORD_NS['w']}}}val")
        for color in rows[row_index].xpath(".//w:color", namespaces=WORD_NS)
        if color.get(f"{{{WORD_NS['w']}}}val")
    ]


def _table_border_values(docx_bytes: bytes) -> list[str]:
    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        document = etree.fromstring(docx.read("word/document.xml"))
    return [
        border.get(f"{{{WORD_NS['w']}}}val")
        for border in document.xpath(
            ".//w:tblBorders/* | .//w:tcBorders/*",
            namespaces=WORD_NS,
        )
        if border.get(f"{{{WORD_NS['w']}}}val")
    ]


def _field_instructions(docx_bytes: bytes) -> list[str]:
    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        document = etree.fromstring(docx.read("word/document.xml"))
    return [
        field.get(f"{{{WORD_NS['w']}}}instr")
        for field in document.xpath(".//w:fldSimple", namespaces=WORD_NS)
        if field.get(f"{{{WORD_NS['w']}}}instr")
    ]


def _bookmark_names(docx_bytes: bytes) -> list[str]:
    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        document = etree.fromstring(docx.read("word/document.xml"))
    return [
        bookmark.get(f"{{{WORD_NS['w']}}}name")
        for bookmark in document.xpath(".//w:bookmarkStart", namespaces=WORD_NS)
        if bookmark.get(f"{{{WORD_NS['w']}}}name")
    ]


def _update_fields_enabled(docx_bytes: bytes) -> bool:
    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        settings = etree.fromstring(docx.read("word/settings.xml"))
    update_fields = settings.find(".//w:updateFields", namespaces=WORD_NS)
    return (
        update_fields is not None
        and update_fields.get(f"{{{WORD_NS['w']}}}val") == "true"
    )


def test_build_english_executive_report_docx_populates_scan_data():
    scan = SimpleNamespace(
        id="scan-id",
        name="Production AWS Assessment",
        completed_at=datetime(2026, 6, 10, tzinfo=timezone.utc),
        provider=SimpleNamespace(provider="aws", uid="123456789012"),
    )
    rows = [
        {
            "uid": "finding-1",
            "status": "FAIL",
            "severity": "high",
            "check_id": "iam_user_mfa_enabled",
            "check_title": "IAM user MFA enabled",
            "risk": "Console users without MFA increase account takeover risk.",
            "resource_uid": "arn:aws:iam::123456789012:user/test",
            "resource_name": "test",
            "region": "global",
            "service": "iam",
            "resource_type": "AwsIamUser",
        },
        {
            "uid": "finding-2",
            "status": "PASS",
            "severity": "critical",
            "check_id": "ec2_security_group_public",
            "check_title": "EC2 security group public access",
            "risk": "",
            "resource_uid": "sg-123",
            "resource_name": "sg-123",
            "region": "ap-northeast-1",
            "service": "ec2",
            "resource_type": "AwsEc2SecurityGroup",
        },
    ]
    findings = [
        SimpleNamespace(
            uid="finding-1",
            check_metadata={"categories": ["identity-access"]},
        ),
        SimpleNamespace(
            uid="finding-2",
            check_metadata={"categories": ["internet-exposed"]},
        ),
    ]
    summary = {
        "generated_at": "2026-06-11T00:00:00+00:00",
        "scan": {"completed_at": "2026-06-10T00:00:00+00:00"},
    }

    docx_bytes = build_english_executive_report_docx(scan, rows, findings, summary)

    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        assert docx.testzip() is None

    text = _document_text(docx_bytes)
    assert "Production AWS Assessment" in text
    assert "123456789012" in text
    assert "2026-06-10" in text
    assert "AWS IAM User" in text
    assert "ap-northeast-1" in text
    assert "IAM user MFA enabled" in text


def test_build_english_findings_report_docx_populates_finding_details():
    scan = SimpleNamespace(
        id="scan-id",
        name="Production AWS Assessment",
        completed_at=datetime(2026, 6, 10, tzinfo=timezone.utc),
        provider=SimpleNamespace(provider="aws", uid="123456789012"),
    )
    rows = [
        {
            "uid": "finding-1",
            "status": "FAIL",
            "severity": "high",
            "check_id": "iam_user_mfa_enabled",
            "check_title": "IAM user MFA enabled",
            "description": "IAM users with console access should use MFA.",
            "risk": "Console users without MFA increase account takeover risk.",
            "remediation": "Enable MFA for every IAM user with console access.",
            "resource_uid": "arn:aws:iam::123456789012:user/test",
            "resource_name": "test",
            "region": "global",
            "service": "iam",
            "resource_type": "AwsIamUser",
            "status_extended": "MFA is not enabled for this user.",
        }
    ]
    findings = [
        SimpleNamespace(
            uid="finding-1",
            check_id="iam_user_mfa_enabled",
            check_metadata={
                "checkid": "iam_user_mfa_enabled",
                "categories": ["identity-access"],
                "remediation": {
                    "recommendation": {
                        "url": "https://example.com/remediate",
                    },
                },
            },
        )
    ]
    summary = {
        "generated_at": "2026-06-11T00:00:00+00:00",
        "scan": {"completed_at": "2026-06-10T00:00:00+00:00"},
    }

    docx_bytes = build_english_findings_report_docx(scan, rows, findings, summary)

    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        assert docx.testzip() is None

    text = _document_text(docx_bytes)
    assert "Production AWS Assessment" in text
    assert "F-001" in text
    assert "IAM user MFA enabled" in text
    assert "High" in text
    assert "AWS IAM User" in text
    assert "https://example.com/remediate" in text
    assert "{{" not in text
    assert "CloudTrail logging is not enabled" not in text

    paragraphs = _paragraph_texts(docx_bytes)
    assert "Description: IAM users with console access should use MFA." in paragraphs
    assert (
        "Risk: Console users without MFA increase account takeover risk."
        in paragraphs
    )
    assert "Current status: MFA is not enabled for this user." in paragraphs


def test_build_findings_report_docx_uses_standard_table_width():
    scan = SimpleNamespace(
        id="scan-id",
        name="Production AWS Assessment",
        completed_at=datetime(2026, 6, 10, tzinfo=timezone.utc),
        provider=SimpleNamespace(provider="aws", uid="123456789012"),
    )
    rows = [
        {
            "uid": "finding-1",
            "status": "FAIL",
            "severity": "high",
            "check_id": "iam_user_mfa_enabled",
            "check_title": "IAM user MFA enabled",
            "resource_uid": "arn:aws:iam::123456789012:user/test",
            "resource_name": "test",
            "region": "global",
            "service": "iam",
            "resource_type": "AwsIamUser",
        }
    ]
    findings = [
        SimpleNamespace(
            uid="finding-1",
            check_id="iam_user_mfa_enabled",
            check_metadata={"checkid": "iam_user_mfa_enabled"},
        )
    ]

    docx_bytes = build_english_findings_report_docx(scan, rows, findings, {})

    assert _first_table_width(docx_bytes) == "7488"


def test_build_findings_report_docx_adds_dynamic_toc_entries():
    scan = SimpleNamespace(
        id="scan-id",
        name="Production AWS Assessment",
        completed_at=datetime(2026, 6, 10, tzinfo=timezone.utc),
        provider=SimpleNamespace(provider="aws", uid="123456789012"),
    )
    rows = [
        {
            "uid": "finding-1",
            "status": "FAIL",
            "severity": "critical",
            "check_id": "iam_user_mfa_enabled",
            "check_title": "IAM user MFA enabled",
            "resource_uid": "arn:aws:iam::123456789012:user/test",
            "resource_name": "test",
            "region": "global",
            "service": "iam",
            "resource_type": "AwsIamUser",
        },
        {
            "uid": "finding-2",
            "status": "FAIL",
            "severity": "high",
            "check_id": "s3_bucket_public_access",
            "check_title": "S3 bucket public access",
            "resource_uid": "arn:aws:s3:::example",
            "resource_name": "example",
            "region": "ap-northeast-1",
            "service": "s3",
            "resource_type": "AwsS3Bucket",
        },
    ]
    findings = [
        SimpleNamespace(
            uid="finding-1",
            check_id="iam_user_mfa_enabled",
            check_metadata={"checkid": "iam_user_mfa_enabled"},
        ),
        SimpleNamespace(
            uid="finding-2",
            check_id="s3_bucket_public_access",
            check_metadata={"checkid": "s3_bucket_public_access"},
        ),
    ]

    docx_bytes = build_english_findings_report_docx(scan, rows, findings, {})

    paragraphs = _paragraph_texts(docx_bytes)
    first_finding = "2.1 Finding F-001 - IAM user MFA enabled"
    second_finding = "2.2 Finding F-002 - S3 bucket public access"

    assert sum(paragraph.startswith(first_finding) for paragraph in paragraphs) == 2
    assert sum(paragraph.startswith(second_finding) for paragraph in paragraphs) == 2
    assert not any("{{finding_number}}" in paragraph for paragraph in paragraphs)
    assert "finding_001" in _bookmark_names(docx_bytes)
    assert "finding_002" in _bookmark_names(docx_bytes)
    assert any("PAGEREF finding_001" in field for field in _field_instructions(docx_bytes))
    assert any("PAGEREF finding_002" in field for field in _field_instructions(docx_bytes))
    assert _update_fields_enabled(docx_bytes)


def test_build_executive_report_docx_supports_localized_text():
    scan = SimpleNamespace(
        id="scan-id",
        name="生产 AWS 评估",
        completed_at=datetime(2026, 6, 10, tzinfo=timezone.utc),
        provider=SimpleNamespace(provider="aws", uid="123456789012"),
    )
    rows = [
        {
            "uid": "finding-1",
            "status": "FAIL",
            "severity": "critical",
            "check_id": "iam_user_mfa_enabled",
            "check_title": "IAM 用户未启用 MFA",
            "risk": "未启用 MFA 会增加账号接管风险。",
            "resource_uid": "arn:aws:iam::123456789012:user/test",
            "resource_name": "test",
            "region": "global",
            "service": "iam",
            "resource_type": "AwsIamUser",
        }
    ]
    findings = [
        SimpleNamespace(
            uid="finding-1",
            check_metadata={"categories": ["identity-access"]},
        )
    ]
    summary = {"scan": {"completed_at": "2026-06-10T00:00:00+00:00"}}

    docx_bytes = build_executive_report_docx(
        scan,
        rows,
        findings,
        summary,
        locale="zh-CN",
    )

    text = _document_text(docx_bytes)
    assert "执行报告" in text
    assert "评估名称: 生产 AWS 评估" in text
    assert "严重" in text
    assert "受影响资产" in text
    assert "{{" not in text
    assert "toc_executive_summary" in _bookmark_names(docx_bytes)
    assert "toc_recommendations" in _bookmark_names(docx_bytes)
    assert any(
        "PAGEREF toc_executive_summary" in field
        for field in _field_instructions(docx_bytes)
    )
    assert any(
        "PAGEREF toc_recommendations" in field
        for field in _field_instructions(docx_bytes)
    )
    assert _update_fields_enabled(docx_bytes)


def test_build_executive_report_docx_does_not_color_severity_table_headers():
    scan = SimpleNamespace(
        id="scan-id",
        name="生产 AWS 评估",
        completed_at=datetime(2026, 6, 10, tzinfo=timezone.utc),
        provider=SimpleNamespace(provider="aws", uid="123456789012"),
    )
    rows = [
        {
            "uid": "finding-1",
            "status": "FAIL",
            "severity": "critical",
            "check_id": "iam_user_mfa_enabled",
            "check_title": "IAM 用户未启用 MFA",
            "risk": "未启用 MFA 会增加账号接管风险。",
            "resource_uid": "arn:aws:iam::123456789012:user/test",
            "resource_name": "test",
            "region": "global",
            "service": "iam",
            "resource_type": "AwsIamUser",
        }
    ]
    findings = [
        SimpleNamespace(
            uid="finding-1",
            check_metadata={"categories": ["identity-access"]},
        )
    ]

    docx_bytes = build_executive_report_docx(
        scan,
        rows,
        findings,
        {},
        locale="zh-CN",
    )

    severity_colors = set(SEVERITY_COLORS.values())
    risk_summary_body_colors = _table_row_text_colors(docx_bytes, 1, 1)
    service_summary_header_colors = _table_row_text_colors(docx_bytes, 7, 0)

    assert SEVERITY_COLORS["critical"] in risk_summary_body_colors
    assert "FFFFFF" in service_summary_header_colors
    assert severity_colors.isdisjoint(service_summary_header_colors)
    assert set(_table_border_values(docx_bytes)) == {"single"}


def test_build_findings_report_docx_supports_localized_detail_tables():
    scan = SimpleNamespace(
        id="scan-id",
        name="Production AWS Assessment",
        completed_at=datetime(2026, 6, 10, tzinfo=timezone.utc),
        provider=SimpleNamespace(provider="aws", uid="123456789012"),
    )
    rows = [
        {
            "uid": "finding-1",
            "status": "FAIL",
            "severity": "high",
            "check_id": "iam_user_mfa_enabled",
            "check_title": "IAM ユーザー MFA 有効化",
            "description": "IAM ユーザーは MFA を使用する必要があります。",
            "risk": "MFA がない場合、アカウント乗っ取りリスクが高まります。",
            "remediation": "MFA を有効化してください。",
            "resource_uid": "arn:aws:iam::123456789012:user/test",
            "resource_name": "test",
            "region": "global",
            "service": "iam",
            "resource_type": "AwsIamUser",
            "status_extended": "MFA が有効化されていません。",
        }
    ]
    findings = [
        SimpleNamespace(
            uid="finding-1",
            check_id="iam_user_mfa_enabled",
            check_metadata={"checkid": "iam_user_mfa_enabled", "categories": ["iam"]},
        )
    ]
    summary = {"scan": {"completed_at": "2026-06-10T00:00:00+00:00"}}

    docx_bytes = build_findings_report_docx(
        scan,
        rows,
        findings,
        summary,
        locale="ja-JP",
    )

    text = _document_text(docx_bytes)
    assert "検出結果詳細レポート" in text
    assert "重大度" in text
    assert "影響リソース" in text
    assert "高" in text
    assert "IAM ユーザー MFA 有効化" in text
    assert "{{" not in text


def test_build_findings_report_docx_replaces_localized_action_placeholders():
    scan = SimpleNamespace(
        id="scan-id",
        name="生产 AWS 评估",
        completed_at=datetime(2026, 6, 10, tzinfo=timezone.utc),
        provider=SimpleNamespace(provider="aws", uid="123456789012"),
    )
    rows = [
        {
            "uid": "finding-1",
            "status": "FAIL",
            "severity": "high",
            "check_id": "organizations_scp_check_deny_regions",
            "check_title": "AWS Organization 使用 SCP 策略将操作限制在已配置的 AWS 区域内",
            "description": "应通过 SCP 将账号操作限制在已批准的区域内。",
            "risk": "未限制区域会带来治理风险。",
            "remediation": "使用 SCP 限制未批准区域。\n定期复核允许区域列表。",
            "resource_uid": "arn:aws:organizations::123456789012:account/o-example/123456789012",
            "resource_name": "123456789012",
            "region": "global",
            "service": "organizations",
            "resource_type": "Other",
            "status_extended": "AWS Organizations is not in-use for this AWS Account.",
        }
    ]
    findings = [
        SimpleNamespace(
            uid="finding-1",
            check_id="organizations_scp_check_deny_regions",
            check_metadata={
                "checkid": "organizations_scp_check_deny_regions",
                "categories": ["identity-access"],
            },
        )
    ]

    docx_bytes = build_findings_report_docx(scan, rows, findings, {}, locale="zh-CN")

    text = _document_text(docx_bytes)
    paragraphs = _paragraph_texts(docx_bytes)
    assert "使用 SCP 限制未批准区域。" in text
    assert "定期复核允许区域列表。" in text
    assert "启用 CloudTrail。" not in text
    assert "当前状态: 此 AWS 账号未使用 AWS Organizations。" in paragraphs
    assert "AWS Organizations is not in-use for this AWS Account." not in text
