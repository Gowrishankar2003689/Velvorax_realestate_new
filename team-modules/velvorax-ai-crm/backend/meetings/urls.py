from django.urls import path

from .views import (
    MeetingListCreateAPIView,
    MeetingDetailAPIView,
    MeetingCancelAPIView,
    MeetingCompleteAPIView
)

urlpatterns = [
    path("", MeetingListCreateAPIView.as_view(), name="meeting-list-create"),
    path("<int:pk>/", MeetingDetailAPIView.as_view(), name="meeting-detail"),
    path(
        "<int:pk>/cancel/",
        MeetingCancelAPIView.as_view(),
        name="meeting-cancel",
    ),
    path(
    "<int:pk>/complete/",
    MeetingCompleteAPIView.as_view(),
    name="meeting-complete",
),
]
