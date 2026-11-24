from rest_framework import serializers
from .models import CallLog, FollowUp

class CallLogSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(
        source="lead.name",
        read_only=True
    )
    lead_phone = serializers.CharField(
        source="lead.phone",
        read_only=True
    )

    class Meta:
        model = CallLog
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

class FollowUpSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(
        source="lead.name",
        read_only=True
    )

    class Meta:
        model = FollowUp
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

class ManualCallSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = [
            "id",
            "lead",
            "call_type",
            "call_status",
            "outcome",
            "summary",
            "duration_seconds",
            "recording",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        attrs["call_type"] = "manual"
        attrs["is_ai_call"] = False
        return attrs
