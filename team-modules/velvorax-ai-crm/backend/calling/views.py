from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser
from .serializers import ManualCallSerializer
from rest_framework.decorators import parser_classes
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from leads.models import Lead
from .models import CallLog, FollowUp
from .serializers import CallLogSerializer, FollowUpSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def start_demo_call(request, lead_id):
    lead = get_object_or_404(Lead, id=lead_id)

    # Enforce consent and calling restrictions.
    if (
    not lead.consent_to_call
    or lead.do_not_call
    or lead.opted_out
):
        call = CallLog.objects.create(
            lead=lead,
            call_status="blocked",
            outcome="Call blocked by consent or do-not-call rules."
        )
        return Response(
            {
                "message": "Call blocked. Verify consent and do-not-call status.",
                "call": CallLogSerializer(call).data,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # A simulated call only: no real phone call is placed.

    with transaction.atomic():
        call = CallLog.objects.create(
            lead=lead,
            call_status="in_progress",
            outcome="Demo call started."
        )

        # Simulate the AI call finishing and a human transfer failing.
    # Simulate AI qualification results.
        call.call_status = "completed"
        call.transfer_status = "failed"

        call.interest_level = "interested"
        call.requirement = "Needs more information about the product."
        call.next_action = "human_handover"
        # Update the lead's CRM status.
        lead.status = "qulified"
        lead.notes = (
            f"{lead.notes}\n"
            "Demo qualification: Interested. "
            "Requirement: Needs more information about the product. "
            "Next action: Human handover."
        ).strip()
        lead.save()

        call.outcome = "Qualified lead; human transfer failed."
        call.summary = (
            "Simulated English AI conversation. "
            "The lead expressed interest and requested product information. "
            "Human transfer failed; a callback was scheduled."
        )
        call.save()

        follow_up = FollowUp.objects.create(
            lead=lead,
            call_log=call,
            scheduled_at=timezone.now(),
            reason="Human transfer failed; contact the lead by callback.",
        )

    return Response(
        {
            "message": "Demo call completed. Callback follow-up created.",
            "call": CallLogSerializer(call).data,
            "follow_up": FollowUpSerializer(follow_up).data,
        },
        status=status.HTTP_201_CREATED,
    )


class CallLogListAPIView(generics.ListCreateAPIView):
    queryset = CallLog.objects.select_related("lead").order_by("-created_at")
    serializer_class = CallLogSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]


class FollowUpListAPIView(generics.ListAPIView):
    queryset = FollowUp.objects.select_related("lead").order_by("-created_at")
    serializer_class = FollowUpSerializer
    permission_classes = [AllowAny]

class FollowUpAssignmentAPIView(RetrieveUpdateAPIView):
    queryset = FollowUp.objects.all()
    serializer_class = FollowUpSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "patch", "head", "options"]

    def partial_update(self, request, *args, **kwargs):
        follow_up = self.get_object()

        if follow_up.status != "pending":
            return Response(
                {"message": "Only pending follow-ups can be assigned."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assigned_to = request.data.get("assigned_to")

        if not isinstance(assigned_to, str) or not assigned_to.strip():
            return Response(
                {"message": "A telecaller name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            follow_up,
            data={"assigned_to": assigned_to.strip()},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def complete_follow_up(request, follow_up_id):
    follow_up = get_object_or_404(FollowUp, id=follow_up_id)

    if follow_up.status != "pending":
        return Response(
            {"message": "Only pending follow-ups can be completed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not follow_up.assigned_to.strip():
        return Response(
            {"message": "Assign a telecaller before completing this follow-up."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    follow_up.status = "completed"
    follow_up.save(update_fields=["status"])

    return Response(
        {
            "message": "Follow-up completed successfully.",
            "follow_up": FollowUpSerializer(follow_up).data,
        },
        status=status.HTTP_200_OK,
    )



@api_view(["POST"])
@permission_classes([AllowAny])
def resolve_handover(request, call_id):
    call = get_object_or_404(CallLog, id=call_id)

    if call.transfer_status not in ["failed", "pending"]:
        return Response(
            {"message": "This call does not need a handover."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    call.handover_resolved = True
    call.save(update_fields=["handover_resolved", "updated_at"])

    return Response(
        {
            "message": "Handover marked as resolved.",
            "call": CallLogSerializer(call).data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def create_manual_call(request):
    from rest_framework.parsers import JSONParser

    parsers = [JSONParser(), MultiPartParser(), FormParser()]


    serializer = ManualCallSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(
        call_type="manual",
        is_ai_call=False,
    )

    return Response(
        {
            "message": "Manual call record created successfully.",
            "call": serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )