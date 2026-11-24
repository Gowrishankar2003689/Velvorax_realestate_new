
from rest_framework import serializers
from .models import Lead


class LeadSerializer(serializers.ModelSerializer):
    interest_level = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

    def get_interest_level(self, obj):
        latest_call = obj.call_logs.order_by("-created_at").first()

        if latest_call:
            return latest_call.interest_level

        return "unknown"

    def validate_phone(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Phone number is required"
            )

        return value
