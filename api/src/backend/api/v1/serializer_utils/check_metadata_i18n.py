import json
from functools import lru_cache
from pathlib import Path

from prowler.lib.check.utils import recover_checks_from_provider

SUPPORTED_LOCALE_SUFFIXES = {
    "zh": "zh-CN",
    "zh-cn": "zh-CN",
    "ja": "ja-JP",
    "ja-jp": "ja-JP",
}


def normalize_accept_language(accept_language: str | None) -> str | None:
    """Normalize an Accept-Language header to a supported metadata locale."""
    if not accept_language:
        return None

    for language_item in accept_language.split(","):
        locale = language_item.split(";")[0].strip().lower()
        if not locale:
            continue

        if locale in SUPPORTED_LOCALE_SUFFIXES:
            return SUPPORTED_LOCALE_SUFFIXES[locale]

        base_locale = locale.split("-")[0]
        if base_locale in SUPPORTED_LOCALE_SUFFIXES:
            return SUPPORTED_LOCALE_SUFFIXES[base_locale]

    return None


@lru_cache(maxsize=12)
def _load_localized_metadata_by_provider(
    provider: str, locale_suffix: str
) -> dict[str, dict]:
    """Load all localized metadata for a provider and locale."""
    localized_metadata = {}

    for check_name, check_path in recover_checks_from_provider(provider):
        metadata_path = Path(check_path) / f"{check_name}.metadata.{locale_suffix}.json"
        if not metadata_path.is_file():
            continue

        with metadata_path.open(encoding="utf-8") as metadata_file:
            metadata = json.load(metadata_file)

        check_id = metadata.get("CheckID")
        if check_id:
            localized_metadata[check_id] = metadata

    return localized_metadata


def get_localized_check_metadata(
    provider: str, check_id: str, accept_language: str | None
) -> dict | None:
    """Get localized check metadata if supported and available."""
    locale_suffix = normalize_accept_language(accept_language)
    if not locale_suffix or not provider or not check_id:
        return None

    try:
        return _load_localized_metadata_by_provider(provider, locale_suffix).get(check_id)
    except Exception:
        return None
