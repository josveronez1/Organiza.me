from ninja import Router, Schema
from .models import Workspace
from django.shortcuts import get_object_or_404

router = Router()

class WorkspaceIn(Schema):
    name: str
    description: str = None
    owner_uid: str

@router.get("/")
def list_workspaces(request):
    workspaces = Workspace.objects.all()
    return list(workspaces.values())
    
@router.post("/")
def create_workspace(request, data: WorkspaceIn):
    workspace = Workspace.objects.create(**data.dict())
    return {"id": workspace.id, "name": workspace.name}

@router.get("/{workspace_id}/")
def get_workspace(request, workspace_id: int):
    workspace = get_object_or_404(Workspace, id=workspace_id)
    return {
        "id": workspace.id,
        "name": workspace.name,
        "description": workspace.description,
        "owner_uid": workspace.owner_uid,
        "created_at": workspace.created_at
    }

@router.put("/{workspace_id}/")
def update_workspace(request, workspace_id: int, data: WorkspaceIn):
    workspace = get_object_or_404(Workspace, id=workspace_id)
    workspace.name = data.name
    workspace.description = data.description
    workspace.owner_uid = data.owner_uid
    workspace.save()
    return {"success": True}

@router.delete("/{workspace_id}/")
def delete_workspace(request, workspace_id: int):
    workspace = get_object_or_404(Workspace, id=workspace_id)
    workspace.delete()
    return {"success": True}
