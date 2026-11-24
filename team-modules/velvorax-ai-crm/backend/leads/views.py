from django.shortcuts import render

from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Lead
from .serializers import LeadSerializer
# Create your views here.

class LeadListCreateAPIView(generics.ListCreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [AllowAny]
