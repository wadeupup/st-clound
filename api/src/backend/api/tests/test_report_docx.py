import zipfile
from datetime import datetime, timezone
from io import BytesIO
from types import SimpleNamespace

from lxml import etree

from api.v1.report_docx import (
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


def _first_table_width(docx_bytes: bytes) -> str | None:
    with zipfile.ZipFile(BytesIO(docx_bytes)) as docx:
        document = etree.fromstring(docx.read("word/document.xml"))
    table_width = document.find(".//w:tbl/w:tblPr/w:tblW", namespaces=WORD_NS)
    if table_width is None:
        return None
    return table_width.get(f"{{{WORD_NS['w']}}}w")


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
    assert "评估名称: 生产 AWS 评估" in text
    assert "严重" in text
    assert "受影响资产" in text


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
    assert "重大度" in text
    assert "影響リソース" in text
    assert "高" in text
    assert "IAM ユーザー MFA 有効化" in text
