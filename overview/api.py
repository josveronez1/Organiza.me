from ninja import Router, Schema
from tasks.models import Task
from boards.models import Stage, Board
from workspaces.models import Workspace
from datetime import datetime, date, timedelta
from django.shortcuts import get_object_or_404
import calendar
from django.db.models import Q

router = Router()

@router.get("/")
def list_overview(request, period: str = "week", ref_date: date = None):
    if ref_date is None:
        ref_date = date.today()

    if period == "day":
        start_date = ref_date
        end_date = ref_date
    elif period == "week":
        start_date = ref_date - timedelta(days=ref_date.weekday())
        end_date = start_date + timedelta(days=6)
    elif period == "month":
        start_date = ref_date.replace(day=1)
        last_day = calendar.monthrange(ref_date.year, ref_date.month)[1]
        end_date = ref_date.replace(day=last_day)

    tasks = Task.objects.select_related(
        'stage',
        'stage__board',
        'stage__board__workspace'
    ).filter(
        stage__board__workspace__owner_uid=request.auth
    ).filter(
        Q(due_date__gte=start_date, due_date__lte=end_date) |
        Q(due_date__isnull=True)
    ).order_by('stage__position', 'due_date')

    result = []
    for task in tasks:
        result.append({
            'id': task.id,
            'title': task.title,
            'due_date': task.due_date,
            'stage_id': task.stage.id,
            'stage_name': task.stage.name,
            'board_id': task.stage.board.id,
            'board_name': task.stage.board.name,
            'workspace_id': task.stage.board.workspace.id,
            'workspace_name': task.stage.board.workspace.name,
        })
    return result