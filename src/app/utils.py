import re


def parse_hashtags(hashtags):
    if hashtags is None:
        return []
    if isinstance(hashtags, str):
        parts = re.split(r"[\s,]+", hashtags.strip())
    else:
        parts = list(hashtags)
    norm = [re.sub(r"^[#%]+", "", p).strip() for p in parts]
    return [p for p in norm if p]


def default_epub_name(hashtags, target_user: str | None, fallback: str) -> str:
    if target_user:
        return f"{target_user}.epub"
    tags = parse_hashtags(hashtags)
    if tags:
        return f"{tags[0]}.epub"
    return fallback
