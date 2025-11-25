from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # ✅ Landing page
    path('', views.landing_view, name='landing'),

    # Authentication
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),

    # Profiles
    path('profile/', views.profile_view, name='profile'),
    path('profile/manage/', views.manage_profile, name='manage_profile'),

    # Main pages
    path('home/', views.home, name='home'),
    path('map_view/', views.map_view, name='map_view'),

    # Listings
    path('create-listing/', views.create_listing, name='create_listing'),
    path('my-listings/', views.my_listings, name='my_listings'),
    path('edit-listing/<int:spot_id>/', views.edit_listing, name='edit_listing'),
    path('delete-listing/<int:id>/', views.delete_listing, name='delete_listing'),
    path('spot/<int:spot_id>/', views.studyspot_detail, name='studyspot_detail'),

    # Staff
    path('apply-staff/', views.apply_staff, name='apply_staff'),

    # API
    path('api/check-username/', views.check_username_uniqueness, name='check_username_uniqueness'),
]
