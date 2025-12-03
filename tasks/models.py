from django.db import models
from boards.models import Stage
from workspaces.models import Workspace
# Create your models here.
class Task(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    stage = models.ForeignKey(Stage, on_delete=models.CASCADE)
    position = models.IntegerField(default=0)
    start_date = models.DateField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    tags = models.ManyToManyField('Tag', blank=True)

    def __str__(self):
        return self.title

class Tag(models.Model):
    name = models.CharField(max_length=10)
    color = models.CharField(max_length=7, default="#3B82F6")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Subtask(models.Model):
    title = models.CharField(max_length=100)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    position = models.IntegerField(default=0)

    def __str__(self):
        return self.title

class Attachment(models.Model):
    file_url = models.URLField(max_length=200)
    file_name = models.CharField(max_length=100)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name