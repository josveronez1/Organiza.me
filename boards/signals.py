from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Board, Stage

@receiver(post_save, sender=Board)
def create_default_stages(sender, instance, created, **kwargs):
    if created:
        Stage.objects.create(
            name="a_fazer",
            board=instance,
            position="0",
            color="#6B7280"
        )
        Stage.objects.create(
            name="fazendo",
            board=instance,
            position="1",
            color="#F59E0B"
        )
        Stage.objects.create(
            name="concluido",
            board=instance,
            position="2",
            color="#10B981"
        )