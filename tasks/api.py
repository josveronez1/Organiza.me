from ninja import Router, Schema
from .models import Task, Tag, Subtask, Attachment
from boards.models import Stage
from workspaces.models import Workspace
from django.shortcuts import get_object_or_404
from datetime import date
from typing import Optional

router = Router()

class TagIn(Schema):
    name: str
    color: str = "#3B82F6"
    workspace_id: int

class TagUpdate(Schema):
    name: Optional[str] = None
    color: Optional[str] = None

class SubtaskIn(Schema):
    title: str
    task_id: int
    is_completed: bool = False
    position: int = 0

class SubtaskUpdate(Schema):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    position: Optional[int] = None

class AttachmentIn(Schema):
    file_url: str
    file_name: str
    task_id: int

class AttachmentUpdate(Schema):
    file_url: Optional[str] = None
    file_name: Optional[str] = None

# ===== ROTAS ESTÁTICAS PRIMEIRO =====

# Tags (rotas estáticas)
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
def update_tag(request, tag_id: int, data: TagUpdate):
    tag = get_object_or_404(Tag, id=tag_id, workspace__owner_uid=request.auth)
    if data.name is not None:
        tag.name = data.name
    if data.color is not None:
        tag.color = data.color
    tag.save()
    return{"success": True}

@router.delete("/tags/{tag_id}/")
def delete_tags(request, tag_id: int):
    tag = get_object_or_404(Tag, id=tag_id, workspace__owner_uid=request.auth)
    tag.delete()
    return{"success": True}

# Subtasks (rotas estáticas)
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
def update_subtask(request, subtask_id: int, data: SubtaskUpdate):
    subtask = get_object_or_404(Subtask, id=subtask_id, task__stage__board__workspace__owner_uid=request.auth)
    if data.title is not None:
        subtask.title = data.title
    if data.is_completed is not None:
        subtask.is_completed = data.is_completed
    if data.position is not None:
        subtask.position = data.position
    subtask.save()
    return{"success": True}

@router.delete("/subtasks/{subtask_id}/")
def delete_subtask(request, subtask_id: int):
    subtask = get_object_or_404(Subtask, id=subtask_id, task__stage__board__workspace__owner_uid=request.auth)
    subtask.delete()
    return{"success": True}

# Attachments (rotas estáticas)
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
def update_attachment(request, attachment_id: int, data: AttachmentUpdate):
    attachment = get_object_or_404(Attachment, id=attachment_id, task__stage__board__workspace__owner_uid=request.auth)
    if data.file_url is not None:
        attachment.file_url = data.file_url
    if data.file_name is not None:
        attachment.file_name = data.file_name
    attachment.save()
    return{"success": True}

@router.delete("/attachments/{attachment_id}/")
def delete_attachment(request, attachment_id: int):
    attachment = get_object_or_404(Attachment, id=attachment_id, task__stage__board__workspace__owner_uid=request.auth)
    attachment.delete()
    return{"success": True}

# ===== ROTAS DINÂMICAS DEPOIS =====

class TaskIn(Schema):
    title: str
    description: Optional[str] = None
    stage_id: int
    position: int = 0
    start_date: Optional[date] = None
    due_date: Optional[date] = None

class TaskUpdate(Schema):
    title: Optional[str] = None
    description: Optional[str] = None
    stage_id: Optional[int] = None
    position: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None

@router.get("/")
def list_tasks(request, stage_id: int = None):
    tasks = Task.objects.filter(stage__board__workspace__owner_uid=request.auth).order_by('position')
    if stage_id:
        tasks = tasks.filter(stage_id=stage_id)
    
    result = []
    for task in tasks:
        task_data = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "stage_id": task.stage_id,
            "position": task.position,
            "start_date": task.start_date,
            "due_date": task.due_date,
            "created_at": task.created_at,
            "tags": list(task.tags.values("id", "name", "color"))
        }
        result.append(task_data)
    return result

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
def update_task(request, task_id: int, data: TaskUpdate):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth)
    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.stage_id is not None:
        task.stage_id = data.stage_id
    if data.position is not None:
        task.position = data.position
    if data.start_date is not None:
        task.start_date = data.start_date
    if data.due_date is not None:
        task.due_date = data.due_date
    task.save()
    return{"success": True}

@router.delete("/{task_id}/")
def delete_tasks(request, task_id: int):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth)
    task.delete()
    return{"success": True}

@router.get("/{task_id}/tags/")
def list_task_tags(request, task_id: int):
    task = get_object_or_404(Task, id=task_id, stage__board__workspace__owner_uid=request.auth)
    return list(task.tags.values())

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