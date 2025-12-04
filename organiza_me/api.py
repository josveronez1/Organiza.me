from ninja import NinjaAPI
from workspaces.api import router as workspaces_router
from boards.api import router as boards_router
from tasks.api import router as tasks_router
from .auth import SupabaseAuth

api = NinjaAPI(auth=SupabaseAuth())

api.add_router("/workspaces/", workspaces_router)
api.add_router("/boards/", boards_router)
api.add_router("/tasks/", tasks_router)

@api.get("/hello")
def hello(request):
    return{"message": "Olá, OrganizaMe"}