from django.urls import path
from .views import (
    start_demo_call,
    CallLogListAPIView,
    FollowUpListAPIView,
    FollowUpAssignmentAPIView, complete_follow_up,
    resolve_handover,
    create_manual_call,
)

urlpatterns = [
    path("start/<int:lead_id>/", start_demo_call, name="start-demo-call"),
    path("history/", CallLogListAPIView.as_view(), name="call-history"),
    path("follow-ups/", FollowUpListAPIView.as_view(), name="follow-ups"),
    path(
    "follow-ups/<int:pk>/",
    FollowUpAssignmentAPIView.as_view(),
    name="follow-up-assignment",
),
    path(
    "follow-ups/<int:follow_up_id>/complete/",
    complete_follow_up,
    name="complete-follow-up",
),
    path(
    "resolve/<int:call_id>/",
    resolve_handover,
    name="resolve-handover",
),
    path("manual/", create_manual_call, name="create-manual-call"),
]
