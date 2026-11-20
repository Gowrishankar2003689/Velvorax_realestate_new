from django.db import models
from leads.models import Lead
# Create your models here.

class CallLog(models.Model):
    CALL_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("blocked", "Blocked"),
    ]

    TRANSFER_STATUS_CHOICES = [
        ("not_required", "Not Required"),
        ("pending", "Pending"),
        ("success", "Successful"),
        ("failed", "Failed"),
    ]

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="call_logs"
    )

    call_status = models.CharField(
        max_length=20,
        choices=CALL_STATUS_CHOICES,
        default="pending"
    )

    is_ai_call = models.BooleanField(default=True)

    transfer_status = models.CharField(
        max_length=20,
        choices=TRANSFER_STATUS_CHOICES,
        default="not_required"
    )
    handover_resolved = models.BooleanField(default=False)

    outcome = models.CharField(max_length=200, blank=True)
    summary = models.TextField(blank=True)
    transcript = models.TextField(blank=True)
    interest_level = models.CharField(
        max_length=20,
        choices=[
            ("unknown", "Unknown"),
            ("interested", "Interested"),
            ("not_interested", "Not Interested"),
            ("undecided", "Undecided"),
        ],
        default="unknown",
    )

    requirement = models.TextField(blank=True)

    next_action = models.CharField(
        max_length=20,
        choices=[
            ("none", "No Further Action"),
            ("callback", "Callback"),
            ("meeting", "Meeting"),
            ("human_handover", "Human Handover"),
        ],
        default="none",
    )
    qualification_status = models.CharField(
    max_length=30,
    default="not_assessed",
    choices=[
        ("not_assessed", "Not Assessed"),
        ("interested", "Interested"),
        ("not_interested", "Not Interested"),
        ("callback_requested", "Callback Requested"),
        ("meeting_requested", "Meeting Requested"),
    ],
    )

    qualification_notes = models.TextField(blank=True)

    next_step = models.CharField(
        max_length=100,
        blank=True,
    )
    duration_seconds = models.PositiveIntegerField(default=0)

    call_type = models.CharField(
    max_length=20,
    choices=[
        ("manual", "Manual Call"),
        ("ai", "AI Call"),
    ],
    default="ai",
)

    recording = models.FileField(
    upload_to="call_recordings/%Y/%m/",
    blank=True,
    null=True,
)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
            return f"Call #{self.id} - {self.lead.name}"



class FollowUp(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="follow_ups"
    )

    call_log = models.ForeignKey(
        CallLog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="follow_ups"
    )

    scheduled_at = models.DateTimeField(null=True, blank=True)
    reason = models.CharField(max_length=255)
    assigned_to = models.CharField(
    max_length=150,
    blank=True,
    default="",
)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Follow-up - {self.lead.name}"