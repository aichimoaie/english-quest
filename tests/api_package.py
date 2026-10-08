"""Tells an absent english_quest_api package, which harnesses skip for, from a broken import inside it, which fails."""

API_PACKAGE = "english_quest_api"


def api_package_is_absent(error: ModuleNotFoundError) -> bool:
    return error.name == API_PACKAGE
