from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('request/', views.request_advance, name='request'),  
    path('eligibleamt/', views.get_eligibleamt, name='get_eligibleamt'),
    path('empwisesal/', views.empwisesal, name='empwisesal'),
    path('ad_approve/', views.ad_approve, name='ad_approve'),
    path('state/', views.state, name='state'),
    path('send-advance-mail/', views.send_advance_mail, name='send_advance_mail'),
    path('approve_mail/', views.send_approval_mail, name='approve_mail'),
]   