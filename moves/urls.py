from django.conf.urls import include, url
from rest_framework import routers
from .views import MoveViewSet, SpotViewSet, index

router = routers.DefaultRouter()
router.register(r'moves', MoveViewSet)
router.register(r'spots', SpotViewSet)

urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^moves$', index, name='index'),
    url(r'^json/', include(router.urls)),
]
