from django.test import TestCase

# Create your tests here.

from rest_framework.test import APIClient

from leads.models import Lead
from calling.models import CallLog, FollowUp


class CallingAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.lead = Lead.objects.create(
            name="Test Customer",
            phone="9000000001",
            consent_to_call=True,
            do_not_call=False,
        )

        self.call_url = f"/api/calling/start/{self.lead.id}/"

    def test_call_blocked_without_consent(self):
        self.lead.consent_to_call = False
        self.lead.save()

        response = self.client.post(self.call_url)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(CallLog.objects.count(), 1)
        self.assertEqual(
            CallLog.objects.first().call_status,
            "blocked",
        )

    def test_call_blocked_for_do_not_call_lead(self):
        self.lead.do_not_call = True
        self.lead.save()

        response = self.client.post(self.call_url)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            CallLog.objects.first().call_status,
            "blocked",
        )

    def test_failed_transfer_creates_follow_up(self):
        response = self.client.post(self.call_url)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(CallLog.objects.count(), 1)
        self.assertEqual(FollowUp.objects.count(), 1)

        call = CallLog.objects.first()

        self.assertEqual(call.call_status, "completed")
        self.assertEqual(call.transfer_status, "failed")

    def test_call_blocked_after_customer_opts_out(self):
        self.lead.opted_out = True
        self.lead.save()

        response = self.client.post(self.call_url)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            CallLog.objects.first().call_status,
            "blocked",
        )
