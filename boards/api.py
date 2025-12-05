from ninja import Router, Schema
from .models import Board, Stage
from workspaces.models import Workspace
from django.shortcuts import get_object_or_404
from typing import Optional

router = Router()

class StageIn(Schema):
    name: str
    board_id: int
    position: int = 0
    color: str = "#6B7280"

class StageUpdate(Schema):
    name: Optional[str] = None
    position: Optional[int] = None
    color: Optional[str] = None

@router.get("/stages/")
def list_stages(request, board_id: int = None):
    stages = Stage.objects.filter(board__workspace__owner_uid=request.auth).order_by('position')
    if board_id:
        stages = stages.filter(board_id=board_id)
    return list (stages.values())

@router.post("/stages/")
def create_stage(request, data: StageIn):
    board = get_object_or_404(Board, id=data.board_id, workspace__owner_uid=request.auth)
    stage = Stage.objects.create(**data.dict())
    return {"id": stage.id, "name": stage.name}

@router.get("/stages/{stage_id}/")
def get_stage(request, stage_id: int):
    stage = get_object_or_404(Stage, id=stage_id, board__workspace__owner_uid=request.auth)
    return{
        "id": stage.id,
        "name": stage.name,
        "board": stage.board_id,
        "position": stage.position,
        "color": stage.color
    }

@router.put("/stages/{stage_id}/")
def update_stage(request, stage_id: int, data: StageUpdate):
    stage = get_object_or_404(Stage, id=stage_id, board__workspace__owner_uid=request.auth)
    if data.name is not None:
        stage.name = data.name 
    if data.position is not None:
        stage.position = data.position
    if data.color is not None:
        stage.color = data.color
    stage.save()
    return{"success": True}

@router.delete("/stages/{stage_id}/")
def delete_stage(request, stage_id: int):
    stage = get_object_or_404(Stage, id=stage_id, board__workspace__owner_uid=request.auth)
    stage.delete()
    return {"success": True}

class BoardIn(Schema):
    name: str
    workspace_id: int
    position: int = 0

class BoardUpdate(Schema):
    name: Optional[str] = None
    position: Optional[int] = None

@router.get("/")
def list_boards(request, workspace_id: int = None):
    boards = Board.objects.filter(workspace__owner_uid=request.auth).order_by('position')
    if workspace_id:
        boards = boards.filter(workspace_id=workspace_id)
    return list (boards.values())

@router.post("/")
def create_board(request, data: BoardIn):
    workspace = get_object_or_404(Workspace, id=data.workspace_id, owner_uid=request.auth)
    board = Board.objects.create(**data.dict())
    return {"id": board.id , "name": board.name}

@router.get("/{board_id}/")
def get_board(request, board_id: int):
    board = get_object_or_404(Board, id=board_id, workspace__owner_uid=request.auth)
    return {
        "id": board.id,
        "name": board.name,
        "workspace_id": board.workspace_id,
        "position": board.position,
        "created_at": board.created_at
    }

@router.put("/{board_id}/")
def update_board(request, board_id: int, data: BoardUpdate):
    board = get_object_or_404(Board, id=board_id, workspace__owner_uid=request.auth)
    if data.name is not None:
        board.name = data.name
    if data.position is not None:
        board.position = data.position
    board.save()
    return{"success": True}

@router.delete("/{board_id}/")
def delete_board(request, board_id: int):
    board = get_object_or_404(Board, id=board_id, workspace__owner_uid=request.auth)
    board.delete()
    return {"success": True}