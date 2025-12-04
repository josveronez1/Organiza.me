from ninja import Router, Schema
from .models import Task, Tag, Subtask, Attachment
from boards.models import Stage
from workspaces.models import Workspace
from django.shortcuts import get_object_or_404
from datetime import date
from typing import Optional

router = Router()

class TaskIn(Schema):
    title: str
    description: Optional[str] = None
    stage_id: int
    position: int = 0
    start_date: Optional[date] = None
    due_date: Optional[date] = None

@router.get("/")
def list_tasks(request, stage_id: int = None):
    tasks = Task.objects.filter(stage__board__workspace__owner_uid=request.auth).order_by('position')
    if stage_id:
        tasks = tasks.filter(stage_id=stage_id)
    return list (tasks.values())

@router.post("/")
def create_task(request, data: TaskIn):
    stage = get_object_or_404(Stage, id=data.stage_id, board__workspace__owner_uid=request.auth)
    task = Task.objects.create(**data.dict())
    return {"id": task.id, "title": task.title}

@router.get("/{task_id}/")
def get_task(request, task_id: int):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth)
    return{
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "stage_id": task.stage_id,
        "position": task.position,
        "start_date": task.start_date,
        "due_date": task.due_date
    }
@router.put("/{task_id}/")
def update_task(request, task_id: int, data: TaskIn):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth)
    task.title = data.title
    task.description = data.description
    task.stage_id = data.stage_id
    task.position = data.position
    task.start_date = data.start_date
    task.due_date = data.due_date
    task.save()
    return{"success": True}

@router.delete("/{task_id}/")
def delete_tasks(request, task_id: int):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth)
    task.delete()
    return{"success": True}

class TagIn(Schema):
    name: str
    color: str = "#3B82F6"
    workspace_id: int

@router.get("/tags/")
def list_tags(request, workspace_id: int = None):
    tags = Tag.objects.filter(workspace__owner_uid=request.auth)
    if workspace_id:
        tags = tags.filter(workspace_id=workspace_id)
    return list (tags.values())

@router.post("/tags/")
def create_tag(request, data: TagIn):
    workspace = get_object_or_404(Workspace, id=data.workspace_id, owner_uid=request.auth)
    tag = Tag.objects.create(**data.dict())
    return {"id": tag.id, "name": tag.name}

@router.get("/tags/{tag_id}/")
def get_tag(request, tag_id: int):
    tag = get_object_or_404(Tag, id=tag_id, workspace__owner_uid=request.auth)
    return{
        "id": tag.id,
        "name": tag.name,
        "color": tag.color,
        "workspace_id": tag.workspace_id
    }
@router.put("/tags/{tag_id}/")
def update_tag(request, tag_id: int, data: TagIn):
    tag = get_object_or_404(Tag, id=tag_id, workspace__owner_uid=request.auth)
    tag.name = data.name
    tag.color = data.color
    tag.workspace_id = data.workspace_id
    tag.save()
    return{"success": True}

@router.delete("/tags/{tag_id}/")
def delete_tags(request, tag_id: int):
    tag = get_object_or_404(Tag, id=tag_id, workspace__owner_uid=request.auth)
    tag.delete()
    return{"success": True}

@router.post("/{task_id}/tags/{tag_id}/")
def add_tag_to_task(request, task_id: int, tag_id: int):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth)
    tag = get_object_or_404(Tag, id=tag_id, workspace__owner_uid=request.auth)
    task.tags.add(tag)
    return {"success": True, "message": "Tag adicionada"}

@router.delete("/{task_id}/tags/{tag_id}/")
def remove_tag_from_task(request, task_id: int, tag_id:int):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth)
    tag = get_object_or_404(Tag, id=tag_id, workspace__owner_uid=request.auth)
    task.tags.remove(tag)
    return {"success": True, "message": "Tag removida"}

@router.get("/{task_id}/tags/")
def list_task_tags(request, task_id: int):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth).order_by('position')
    return list(task.tags.values())

class SubtaskIn(Schema):
    title: str
    task_id: int
    is_completed: bool = False
    position: int = 0

@router.get("/subtasks/")
def list_subtasks(request, task_id: int = None):
    subtasks = Subtask.objects.filter(task__stage__board__workspace__owner_uid=request.auth).order_by('position')
    if task_id:
        subtasks = subtasks.filter(task_id=task_id)
    return list (subtasks.values())

@router.post("/subtasks/")
def create_subtask(request, data: SubtaskIn):
    task = get_object_or_404(Task, id=data.task_id, stage__board__workspace__owner_uid=request.auth)
    subtask = Subtask.objects.create(**data.dict())
    return {"id": subtask.id, "title": subtask.title}

@router.get("/subtasks/{subtask_id}/")
def get_subtask(request, subtask_id: int):
    subtask = get_object_or_404(Subtask, id=subtask_id, task__stage__board__workspace__owner_uid=request.auth)
    return{
        "id": subtask.id,
        "title": subtask.title,
        "task_id": subtask.task_id,
        "is_completed": subtask.is_completed,
        "position": subtask.position
    }

@router.put("/subtasks/{subtask_id}/")
def update_subtask(request, subtask_id: int, data: SubtaskIn):
    subtask = get_object_or_404(Subtask, id=subtask_id, task__stage__board__workspace__owner_uid=request.auth)
    subtask.title = data.title
    subtask.task_id = data.task_id
    subtask.is_completed = data.is_completed
    subtask.position = data.position
    subtask.save()
    return{"success": True}

@router.delete("/subtasks/{subtask_id}/")
def delete_subtask(request, subtask_id: int):
    subtask = get_object_or_404(Subtask, id=subtask_id, task__stage__board__workspace__owner_uid=request.auth)
    subtask.delete()
    return{"success": True}

class AttachmentIn(Schema):
    file_url: str
    file_name: str
    task_id: int

@router.get("/attachments/")
def list_attachments(request, task_id: int = None):
    attachments = Attachment.objects.filter(task__stage__board__workspace__owner_uid=request.auth)
    if task_id:
        attachments = attachments.filter(task_id=task_id)
    return list (attachments.values())

@router.post("/attachments/")
def create_attachment(request, data: AttachmentIn):
    task = get_object_or_404(Task, id=data.task_id, stage__board__workspace__owner_uid=request.auth)
    attachment = Attachment.objects.create(**data.dict())
    return {"id": attachment.id, "file_name": attachment.file_name}

@router.get("/attachments/{attachment_id}/")
def get_attachment(request, attachment_id: int):
    attachment = get_object_or_404(Attachment, id=attachment_id, task__stage__board__workspace__owner_uid=request.auth)
    return{
        "id": attachment.id,
        "file_url": attachment.file_url,
        "file_name": attachment.file_name,
        "task_id": attachment.task_id
    }

@router.put("/attachments/{attachment_id}/")
def update_attachment(request, attachment_id: int, data: AttachmentIn):
    attachment = get_object_or_404(Attachment, id=attachment_id, task__stage__board__workspace__owner_uid=request.auth)
    attachment.file_url = data.file_url
    attachment.file_name = data.file_name
    attachment.task_id = data.task_id
    attachment.save()
    return{"success": True}

@router.delete("/attachments/{attachment_id}/")
def delete_attachment(request, attachment_id: int):
    attachment = get_object_or_404(Attachment, id=attachment_id, task__stage__board__workspace__owner_uid=request.auth)
    attachment.delete()
    return{"success": True}

class MoveTaskIn(Schema):
    stage_id: int
    position: int

@router.patch("/{task_id}/move/")
def move_task(request, task_id: int, data: MoveTaskIn):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth)
    new_stage = get_object_or_404(Stage, id=data.stage_id, board__workspace__owner_uid=request.auth)
    task.stage_id = data.stage_id
    task.position = data.position
    task.save()
    return {"success": True}