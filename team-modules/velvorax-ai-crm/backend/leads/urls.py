from django.urls import path
from .views import LeadListCreateAPIView


urlpatterns = [
    path("",LeadListCreateAPIView.as_view(),name="lead-list-create"),
]