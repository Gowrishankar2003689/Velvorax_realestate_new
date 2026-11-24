from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from .models import Meeting
from .serializers import MeetingSerializer


class MeetingListCreateAPIView(generics.ListCreateAPIView):
    queryset = Meeting.objects.select_related("lead").order_by(
        "-scheduled_at"
    )
    serializer_class = MeetingSerializer
    permission_classes = [AllowAny]


class MeetingDetailAPIView(generics.RetrieveUpdateAPIView):
    queryset = Meeting.objects.select_related("lead")
    serializer_class = MeetingSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "patch", "head", "options"]


class MeetingCancelAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            meeting = Meeting.objects.get(pk=pk)
        except Meeting.DoesNotExist:
            return Response(
                {"message": "Meeting not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if meeting.status != "scheduled":
            return Response(
                {"message": "Only scheduled meetings can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        meeting.status = "cancelled"
        meeting.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "message": "Meeting cancelled successfully.",
                "meeting": MeetingSerializer(meeting).data,
            },
            status=status.HTTP_200_OK,
        )


class MeetingCompleteAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            meeting = Meeting.objects.get(pk=pk)
        except Meeting.DoesNotExist:
            return Response(
                {"message": "Meeting not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if meeting.status != "scheduled":
            return Response(
                {
                    "message": (
                        "Only scheduled meetings can be completed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        meeting.status = "completed"
        meeting.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "message": "Meeting completed successfully.",
                "meeting": MeetingSerializer(meeting).data,
            },
            status=status.HTTP_200_OK,
        )