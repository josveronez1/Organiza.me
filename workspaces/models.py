from django.db import models

# Create your models here
class Workspace(models.Model):
    name = models.CharField(max_length = 30)
    description = models.TextField(null=True, blank=True)
    owner_uid = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name