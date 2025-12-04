from ninja import Router, Schema
from .models import Board, Stage
from django.shortcuts import get_object_or_404

router = Router()

class StageIn(Schema):
    name: str
    board_id: int
    position: int = 0
    color: str = "#6B7280"

@router.get("/stages/")
def list_stages(request, board_id: int = None):
    stages = Stage.objects.all()
    if board_id:
        stages = stages.filter(board_id=board_id)
    return list (stages.values())

@router.post("/stages/")
def create_stage(request, data: StageIn):
    stage = Stage.objects.create(**data.dict())
    return {"id": stage.id, "name": stage.name}

@router.get("/stages/{stage_id}/")
def get_stage(request, stage_id: int):
    stage = get_object_or_404(Stage, id=stage_id)
    return{
        "id": stage.id,
        "name": stage.name,
        "board": stage.board_id,
        "position": stage.position,
        "color": stage.color
    }

@router.put("/stages/{stage_id}/")
def update_stage(request, stage_id: int, data: StageIn):
    stage = get_object_or_404(Stage, id=stage_id)
    stage.name = data.name 
    stage.position = data.position
    stage.color = data.color
    stage.save()
    return{"success": True}

@router.delete("/stages/{stage_id}/")
def delete_stage(request, stage_id: int):
    stage = get_object_or_404(Stage, id=stage_id)
    stage.delete()
    return {"success": True}

class BoardIn(Schema):
    name: str
    workspace_id: int
    position: int = 0

@router.get("/")
def list_boards(request, workspace_id: int = None):
    boards = Board.objects.all()
    if workspace_id:
        boards = boards.filter(workspace_id=workspace_id)
    return list (boards.values())

@router.post("/")
def create_board(request, data: BoardIn):
    board = Board.objects.create(**data.dict())
    return {"id": board.id , "name": board.name}

@router.get("/{board_id}/")
def get_board(request, board_id: int):
    board = get_object_or_404(Board, id=board_id)
    return {
        "id": board.id,
        "name": board.name,
        "workspace": board.workspace_id,
        "position": board.position,
        "created_at": board.created_at
    }

@router.put("/{board_id}/")
def update_board(request, board_id: int, data: BoardIn):
    board = get_object_or_404(Board, id=board_id)
    board.name = data.name
    board.position = data.position
    board.save()
    return{"success": True}

@router.delete("/{board_id}/")
def delete_board(request, board_id: int):
    board = get_object_or_404(Board, id=board_id)
    board.delete()
    return {"success": True}