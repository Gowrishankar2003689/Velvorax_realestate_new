from django.utils import timezone
from rest_framework import serializers
from .models import Meeting


class MeetingSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(
        source="lead.name",
        read_only=True,
    )

    class Meta:
        model = Meeting
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_scheduled_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError(
                "Meeting must be scheduled for a future date and time."
            )
        return value

    def validate_duration_minutes(self, value):
        if value < 5 or value > 480:
            raise serializers.ValidationError(
                "Meeting duration must be between 5 and 480 minutes."
            )
        return value
