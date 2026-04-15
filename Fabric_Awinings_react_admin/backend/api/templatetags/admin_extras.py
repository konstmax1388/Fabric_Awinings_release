"""Доп. фильтры и теги для шаблонов админки."""

from django import template

register = template.Library()


def _fs_slug_from_classes(classes) -> str:
    if not classes:
        return ""
    for c in str(classes).split():
        if c.startswith("fs-id-"):
            return c[len("fs-id-") :]
    return ""


@register.filter
def fieldset_fs_slug(classes) -> str:
    """Суффикс якоря из класса fs-id-<slug>."""
    return _fs_slug_from_classes(classes)


@register.filter
def sitesettings_fieldset_id(classes) -> str:
    """Устаревшее имя; используйте fieldset_fs_slug."""
    return _fs_slug_from_classes(classes)


@register.simple_tag
def has_nav_item_active_deep(items: list) -> bool:
    """Есть ли активный пункт в дереве сайдбара (включая вложенные item.items)."""
    if not items:
        return False
    for item in items:
        if item.get("active"):
            return True
        nested = item.get("items") or []
        if nested and has_nav_item_active_deep(nested):
            return True
    return False


def _any_descendant_nav_active(item: dict) -> bool:
    for sub in item.get("items") or []:
        if sub.get("active"):
            return True
        if _any_descendant_nav_active(sub):
            return True
    return False


@register.simple_tag
def nav_item_or_descendant_active(item: dict) -> bool:
    """Текущий пункт или любой вложенный помечен Unfold как active (подсветка родителя, flyout)."""
    if item.get("active"):
        return True
    return _any_descendant_nav_active(item)
