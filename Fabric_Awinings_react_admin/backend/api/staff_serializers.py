"""Сериализаторы Staff API (поля в JSON — camelCase)."""

from rest_framework import serializers

from .models import CallbackLead


class CallbackLeadStaffSerializer(serializers.ModelSerializer):
    """Чтение заявок «обратный звонок» для персонала."""

    class Meta:
        model = CallbackLead
        fields = ("id", "name", "phone", "comment", "source", "created_at")

    def to_representation(self, instance: CallbackLead) -> dict:
        return {
            "id": str(instance.pk),
            "name": instance.name,
            "phone": instance.phone,
            "comment": instance.comment,
            "source": instance.source,
            "sourceLabel": instance.get_source_display(),
            "createdAt": instance.created_at.isoformat() if instance.created_at else None,
        }
