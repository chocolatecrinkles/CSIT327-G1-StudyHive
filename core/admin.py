from django.contrib import admin
from .models import StaffApplication
from .models import UserProfile
from .models import StudySpot

@admin.register(StaffApplication)
class StaffApplicationAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'study_place_name', 'status', 'submitted_at')
    list_filter = ('status',)
    search_fields = ('full_name', 'study_place_name', 'user__username')

    fieldsets = (
        ("Personal Information", {
            'fields': ('full_name', 'email', 'phone_number', 'government_id')
        }),
        ("Affiliation / Study Place Details", {
            'fields': (
                'study_place_name', 'study_place_address', 'study_place_website',
                'business_registration_number', 'proof_of_ownership', 'role_description'
            )
        }),
        ("Address & Online Verification", {
            'fields': ('proof_of_address', 'social_media_links')
        }),
        ("Status", {'fields': ('status',)})
    )

@admin.register(StudySpot)
class StudySpotAdmin(admin.ModelAdmin):
    list_display = (
        "name", "owner", "wifi", "open_24_7", "outlets", "coffee", "ac", "pastries", "is_trending"
    )
    list_filter = ("wifi", "open_24_7", "outlets", "coffee", "ac", "pastries", "is_trending")
    search_fields = ("name", "location", "description")
    fieldsets = (
        (None, {
            "fields": ("owner", "name", "location", "description")
        }),
        ("Amenities", {
            "fields": ("wifi", "open_24_7", "outlets", "coffee", "ac", "pastries")
        }),
    )

    list_editable = ('is_trending',)



    actions = ['approve_applications', 'reject_applications']

    def approve_applications(self, request, queryset):
        queryset.update(status='Approved')
        for app in queryset:
            app.user.is_staff = True
            app.user.save()
        self.message_user(request, "✅ Approved applications; users are now staff.")

    def reject_applications(self, request, queryset):
        queryset.update(status='Rejected')
        self.message_user(request, "❌ Rejected selected applications.")

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth import login, logout
from core.forms import CustomUserCreationForm, CustomAuthenticationForm
from .models import UserProfile  
from django.http import JsonResponse
from core.models import StudySpot
from django.core.exceptions import PermissionDenied
from .models import StaffApplication
import os
from supabase import create_client
from dotenv import load_dotenv
from .forms import StaffApplicationForm
from .forms import StudySpotForm


def staff_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_staff:
            raise PermissionDenied  # Returns a 403 Forbidden page
        return view_func(request, *args, **kwargs)
    return login_required(wrapper)

def login_view(request):

    if request.user.is_authenticated:
        return redirect("core:home")

    if request.method == "POST":
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            next_url = request.GET.get("next") or "core:home"
            return redirect(next_url)
        else:
            messages.error(request, "Invalid credentials.")
    else:
        form = CustomAuthenticationForm()
    return render(request, "login.html", {"form": form})



@login_required(login_url="core:login")
def home(request):
    if request.user.is_authenticated:
        # Check if user is now staff but hasn't seen the popup
        if request.user.is_staff and not request.session.get('staff_approved_popup_shown', False):
            request.session['staff_approved_popup_shown'] = True  # mark as shown
            show_staff_popup = True
        else:
            show_staff_popup = False
    else:
        show_staff_popup = False

    study_spaces = StudySpot.objects.all()
    return render(request, 'home.html', {
        'study_spaces': study_spaces,
        'show_staff_popup': show_staff_popup
    })


def logout_view(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect("core:login")  # ✅ Namespace added


def register_view(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Account created successfully!")
            return redirect("core:home")  # ✅ Namespace added
        else:
            messages.error(request, "Please fix the errors below.")
    else:
        form = CustomUserCreationForm()
    return render(request, "register.html", {"form": form})


@login_required(login_url='core:login')
def profile_view(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    return render(request, "profile.html", {"profile": profile})


@login_required(login_url='core:login')
def manage_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        # Get form data
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        middle_initial = request.POST.get("middle_initial", "").strip()
        phone_number = request.POST.get("phone_number", "").strip()
        bio = request.POST.get("bio", "").strip()
        
        # Get file and removal flag
        avatar = request.FILES.get("avatar")
        avatar_removed = request.POST.get("avatar_removed")

        # Validate required fields
        if not first_name or not last_name or not username or not email:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({"status": "error", "message": "First name, last name, username, and email are required."}, status=400)
            messages.error(request, "First name, last name, username, and email are required.")
            return redirect("core:manage_profile")

        # Update user fields
        user = request.user
        user.first_name = first_name
        user.last_name = last_name
        user.username = username
        user.email = email
        user.save()

        # Update profile fields
        profile.middle_initial = middle_initial
        profile.phone_number = phone_number
        profile.bio = bio

        # Handle avatar removal
        if avatar_removed == 'true':
            # Delete existing avatar if it exists
            if profile.avatar_url:
                profile.avatar_url.delete(save=False)
                profile.avatar_url = None
        # Handle new avatar upload (only if not removing)
        elif avatar:
            # Delete old avatar if uploading new one
            if profile.avatar_url:
                profile.avatar_url.delete(save=False)
            profile.avatar_url = avatar

        # Update full name
        profile.full_name = f"{first_name} {middle_initial} {last_name}".strip()
        profile.save()

        # Return JSON response if AJAX request
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({"status": "ok", "message": "Profile updated successfully."})
        
        # Regular form submission
        messages.success(request, "Profile updated successfully.")
        return redirect("core:profile")

    context = {
        "profile": profile,
        "user": request.user,
    }
    return render(request, "manage_profile.html", context)


@login_required(login_url="core:login")
def map_view(request):
    spots = StudySpot.objects.all()
    return render(request, "map_view.html", {
        "study_spots": spots
    })











@staff_required
def create_listing(request):
    if request.method == 'POST':
        # regular fields
        name = request.POST.get('name', '').strip()
        location = request.POST.get('location', '').strip()
        description = request.POST.get('description', '').strip()

        wifi = request.POST.get('wifi') == 'on'
        ac = request.POST.get('ac') == 'on'
        free = request.POST.get('free') == 'on'
        coffee = request.POST.get('coffee') == 'on'

        open_24_7 = request.POST.get('open_24_7') == 'on'
        outlets = request.POST.get('outlets') == 'on'
        pastries = request.POST.get('pastries') == 'on'
        is_trending = request.POST.get('is_trending') == 'on'

        image_file = request.FILES.get('image')
        image_url = None

        # ── Upload to Supabase if file present ────────────────────────────
        if image_file:
            try:
                file_bytes = image_file.read()
                # path: study_spots/<user_id>/<original_filename>
                path = f"study_spots/{request.user.id}/{image_file.name}"

                bucket = supabase.storage.from_("study_spots")
                bucket.upload(path, file_bytes, {
                    "content-type": image_file.content_type
                })

                public_url = bucket.get_public_url(path)
                image_url = public_url
            except Exception as e:
                messages.error(request, f"Error uploading image: {e}")
                image_url = None

        # ── Save StudySpot row ─────────────────────────────────────────────
        StudySpot.objects.create(
            owner=request.user,
            name=name,
            location=location,
            description=description,
            wifi=wifi,
            ac=ac,
            free=free,
            coffee=coffee,
            open_24_7=open_24_7,
            outlets=outlets,
            pastries=pastries,
            is_trending=is_trending,
            image_url=image_url,
        )

        messages.success(request, "✅ Listing successfully created!")
        return redirect('core:home')

    # GET – show blank form
    form = StudySpotForm()
    return render(request, 'create_listing.html', {'form': form})














@staff_required
def my_listings_view(request):
    my_listings = StudySpot.objects.filter(owner=request.user).order_by('-id')
    return render(request, 'my_listings.html', {'my_listings': my_listings})









@staff_required
def edit_listing(request, id):
    spot = get_object_or_404(StudySpot, id=id)

    # security check: only owner can edit
    if spot.owner != request.user:
        messages.error(request, "You are not authorized to edit this listing.")
        return redirect('core:my_listings')

    if request.method == 'POST':
        form = StudySpotForm(request.POST, instance=spot)
        image_file = request.FILES.get('image')
        if form.is_valid():
            spot = form.save(commit=False)

            # ── if a new image was uploaded, push to Supabase ────────────
            if image_file:
                try:
                    file_bytes = image_file.read()
                    path = f"study_spots/{request.user.id}/{image_file.name}"

                    bucket = supabase.storage.from_("study_spots")
                    bucket.upload(path, file_bytes, {
                        "content-type": image_file.content_type
                    })

                    public_url = bucket.get_public_url(path)
                    spot.image_url = public_url
                except Exception as e:
                    messages.error(request, f"Error uploading new image: {e}")

            spot.save()
            messages.success(request, "Listing updated successfully.")
            return redirect('core:my_listings')
    else:
        form = StudySpotForm(instance=spot)

    return render(request, 'edit_listing.html', {'form': form, 'spot': spot})












@staff_required
def delete_listing(request, id):
    spot = get_object_or_404(StudySpot, id=id)

    # ---CRITICAL SECURITY CHECK ---
    if spot.owner != request.user:
        messages.error(request, "You are not authorized to delete this listing.")
        return redirect('core:my_listings')
    # --- END OF CHECK ---

    if request.method == "POST":
        spot.delete()
        messages.success(request, "Listing successfully deleted.")
    
    return redirect("core:my_listings")


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@login_required
def apply_staff(request):
    # Get existing application (if any)
    application = StaffApplication.objects.filter(user=request.user).first()

    if request.method == "POST":
        form = StaffApplicationForm(request.POST, request.FILES, instance=application)
        if form.is_valid():
            app = form.save(commit=False)
            app.user = request.user
            app.status = "Pending"
            app.save()

            # Upload each file field to Supabase Storage
            file_fields = ["government_id", "proof_of_ownership", "proof_of_address"]
            for field_name in file_fields:
                uploaded_file = request.FILES.get(field_name)
                if uploaded_file:
                    path = f"staff_docs/{field_name}/{uploaded_file.name}"
                    file_content = uploaded_file.read()
                    supabase.storage.from_("staff_docs").upload(path, file_content)

                    # Generate public URL for the uploaded file
                    public_url = supabase.storage.from_("staff_docs").get_public_url(path)
                    setattr(app, field_name, public_url)

            app.save()

            return render(request, "apply_staff.html", {
                "submitted": True,
                "application": app,
            })

        else:
            return render(request, "apply_staff.html", {
                "form": form,
                "application": application,
                "error": "Please check your form fields and try again.",
            })

    else:
        form = StaffApplicationForm(instance=application)

    return render(request, "apply_staff.html", {
        "form": form,
        "application": application,
    })

# In your staff approval function (admin.py or views.py)

def approve_staff_application(request, application_id): # Make sure 'request' is available
    application = StaffApplication.objects.get(id=application_id)
    user = application.user
    
    # 1. Make the user staff
    user.is_staff = True
    user.save()
    
    # 2. SET THE TRIGGER FLAG in the session
    request.session['show_staff_congrats'] = True 

    # Update application status
    application.status = 'Approved'
    application.save()
    
    # Redirect or return response
    # ...


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_contributor', 'phone_number', 'full_name')
    list_filter = ('is_contributor',)
    search_fields = ('user__username', 'user__email', 'full_name')