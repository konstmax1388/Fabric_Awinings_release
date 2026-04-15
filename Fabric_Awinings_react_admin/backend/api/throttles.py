from rest_framework.throttling import SimpleRateThrottle


class LeadSubmissionThrottle(SimpleRateThrottle):
    scope = "lead_submit"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class AuthRegisterThrottle(SimpleRateThrottle):
    scope = "auth_register"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class CheckoutSubmissionThrottle(SimpleRateThrottle):
    """Оформление заказа: отдельный лимит от заявок (антиспам / фрод)."""

    scope = "checkout_submit"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }
