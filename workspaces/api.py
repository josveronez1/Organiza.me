from ninja import Router, Schema
from .models import Workspace
from django.shortcuts import get_object_or_404
from typing import Optional

router = Router()

class WorkspaceIn(Schema):
    name: str
    description: str = None

class WorkspaceUpdate(Schema):
    name: Optional[str] = None
    description: Optional[str] = None

@router.get("/")
def list_workspaces(request):
    workspaces = Workspace.objects.filter(owner_uid=request.auth)
    return list(workspaces.values())
    
@router.post("/")
def create_workspace(request, data: WorkspaceIn):
    workspace = Workspace.objects.create(
        name=data.name,
        description=data.description,
        owner_uid=request.auth
    )
    return {"id": workspace.id, "name": workspace.name}

@router.get("/{workspace_id}/")
def get_workspace(request, workspace_id: int):
    workspace = get_object_or_404(Workspace, id=workspace_id, owner_uid=request.auth)
    return {
        "id": workspace.id,
        "name": workspace.name,
        "description": workspace.description,
        "owner_uid": workspace.owner_uid,
        "created_at": workspace.created_at
    }

@router.put("/{workspace_id}/")
def update_workspace(request, workspace_id: int, data: WorkspaceUpdate):
    workspace = get_object_or_404(Workspace, id=workspace_id, owner_uid=request.auth)
    if data.name is not None:
        workspace.name = data.name
    if data.description is not None:
        workspace.description = data.description
    workspace.save()
    return {"success": True}

@router.delete("/{workspace_id}/")
def delete_workspace(request, workspace_id: int):
    workspace = get_object_or_404(Workspace, id=workspace_id, owner_uid=request.auth)
    workspace.delete()
    return {"success": True}
