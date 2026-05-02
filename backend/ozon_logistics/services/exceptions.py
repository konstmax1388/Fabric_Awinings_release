class OzonLogisticsConfigError(RuntimeError):
    """Нет Client-Id / Api-Key для приложения Ozon Доставка (ни env, ни запись в админке)."""


class OzonLogisticsPhoneNotAllowedError(RuntimeError):
    """Телефон покупателя не входит в список разрешённых для создания заказа в Ozon."""
