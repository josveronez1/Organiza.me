from django.db import models
from workspaces.models import Workspace

# Create your models here.
class Board(models.Model):
    name = models.CharField(max_length=30)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    position = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Stage(models.Model):
    name = models.CharField(max_length=20)
    board = models.ForeignKey(Board, on_delete=models.CASCADE)
    position = models.IntegerField(default=0)
    color = models.CharField(max_length=7, default="#6B7280")

    def __str__(self):
        return self.name