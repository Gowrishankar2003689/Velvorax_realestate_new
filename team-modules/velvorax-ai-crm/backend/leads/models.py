from django.db import models

# Create your models here.

class Lead(models.Model):
    STATUS_CHOICES=[
        ('new',"New"),
        ('contacted','Contacted'),
        ('qulified','Qulified'),
        ('converted','Converted'),
        ('lost','Lost')
    ]


    name = models.CharField(max_length=150)
    company = models.CharField(max_length=150,blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20,unique=True)
    source = models.CharField(max_length=100,blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
    )

    notes = models.TextField(blank=True)

    consent_to_call = models.BooleanField(default=False)

    do_not_call = models.BooleanField(default=False)
    opted_out = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.phone})'