# core/views.py

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth import login, logout, get_user_model
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from django.db.models import Q

from .models import UserProfile, StaffApplication, Review
from core.models import StudySpot
from .forms import (
    CustomUserCreationForm,
    CustomAuthenticationForm,
    StaffApplicationForm,
    StudySpotForm,
    ReviewForm,
)

from django.conf import settings

import os
import uuid
import json
import time

# --- SUPABASE / STORAGE SETUP ---
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    else:
        supabase = None
        print("WARNING: Supabase credentials not found in environment variables.")
except Exception as e:
    supabase = None
    print(f"ERROR initializing Supabase client: {e}")

User = get_user_model()


# ---------- HELPERS ----------

def contributor_required(view_func):
    @login_required
    def wrapper(request, *args, **kwargs):
        profile = getattr(request.user, "userprofile", None)
        if not profile or not profile.is_contributor:
            raise PermissionDenied("You are not authorized to access this page.")
        return view_func(request, *args, **kwargs)

    return wrapper


def upload_studyspot_image(image_file, spot_id):
    """
    Upload a listing image to Supabase Storage (bucket: study_spots)
    and return the public URL. Returns None on failure.
    """
    if not supabase:
        print("Supabase client not initialized.")
        return None

    if not image_file:
        return None

    bucket_name = "study_spots"

    # Unique file name per image
    ext = os.path.splitext(image_file.name)[1] or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    path = f"spots/{spot_id}/{unique_name}"

    try:
        image_file.seek(0)
        file_content = image_file.read()

        supabase.storage.from_(bucket_name).upload(
            path=path,
            file=file_content,
            file_options={"content-type": image_file.content_type},
        )

        public_url = supabase.storage.from_(bucket_name).get_public_url(path)
        public_url = f"{public_url}?v={int(time.time())}"
        return public_url

    except Exception as e:
        print(f"[StudySpot Image Upload Error] {e}")
        return None



# ---------- AUTH / ACCOUNT VIEWS ----------

def landing_view(request):
    # If user is already logged in → send them to home
    if request.user.is_authenticated:
        return redirect("core:home")
    query = request.GET.get("q", "").strip()
    filter_by = request.GET.get("filter", "all")

    study_spaces = StudySpot.objects.all()

    # Search
    if query:
        study_spaces = study_spaces.filter(
            Q(name__icontains=query)
            | Q(location__icontains=query)
            | Q(description__icontains=query)
        )

    # Filters
    if filter_by == "wifi":
        study_spaces = study_spaces.filter(wifi=True)
    elif filter_by == "ac":
        study_spaces = study_spaces.filter(ac=True)
    elif filter_by == "outlets":
        study_spaces = study_spaces.filter(outlets=True)
    elif filter_by == "coffee":
        study_spaces = study_spaces.filter(coffee=True)
    elif filter_by == "pastries":
        study_spaces = study_spaces.filter(pastries=True)
    elif filter_by == "open24":
        study_spaces = study_spaces.filter(open_24_7=True)
    elif filter_by == "trending":
        study_spaces = study_spaces.filter(is_trending=True)

    context = {
        "study_spaces": study_spaces,
        "query": query,
        "filter_by": filter_by,
    }
    return render(request, "landing.html", context)

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


def logout_view(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect("core:login")


def register_view(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Account created successfully!")
            return redirect("core:home")
        else:
            messages.error(request, "Please fix the errors below.")
    else:
        form = CustomUserCreationForm()

    return render(request, "register.html", {"form": form})


# ---------- HOME / MAP ----------

@login_required(login_url="core:login")
def home(request):
    profile = UserProfile.objects.get(user=request.user)

    query = request.GET.get("q", "").strip()
    filter_by = request.GET.get("filter", "all")

    study_spaces = StudySpot.objects.all()

    # Search
    if query:
        study_spaces = study_spaces.filter(
            Q(name__icontains=query)
            | Q(location__icontains=query)
            | Q(description__icontains=query)
        )

    # Filters
    if filter_by == "wifi":
        study_spaces = study_spaces.filter(wifi=True)
    elif filter_by == "ac":
        study_spaces = study_spaces.filter(ac=True)
    elif filter_by == "outlets":
        study_spaces = study_spaces.filter(outlets=True)
    elif filter_by == "coffee":
        study_spaces = study_spaces.filter(coffee=True)
    elif filter_by == "pastries":
        study_spaces = study_spaces.filter(pastries=True)
    elif filter_by == "open24":
        study_spaces = study_spaces.filter(open_24_7=True)
    elif filter_by == "trending":
        study_spaces = study_spaces.filter(is_trending=True)

    context = {
        "study_spaces": study_spaces,
        "query": query,
        "filter_by": filter_by,
        "profile": profile,
    }
    return render(request, "home.html", context)


@login_required(login_url="core:login")
def map_view(request):
    profile = UserProfile.objects.get(user=request.user)

    query = request.GET.get("q", "")
    filter_by = request.GET.get("filter", "all")

    # faster + cleaner
    study_spots = StudySpot.objects.all()

    # Search
    if query:
        study_spots = study_spots.filter(
            Q(name__icontains=query) |
            Q(location__icontains=query) |
            Q(description__icontains=query)
        )

    # Filter
    if filter_by == "wifi":
        study_spots = study_spots.filter(wifi=True)
    elif filter_by == "ac":
        study_spots = study_spots.filter(ac=True)
    elif filter_by == "coffee":
        study_spots = study_spots.filter(coffee=True)
    elif filter_by == "open24":
        study_spots = study_spots.filter(open_24_7=True)

    return render(
        request,
        "map_view.html",
        {
            "study_spots": study_spots,
            "profile": profile
        }
    )


# ---------- PROFILE ----------

@login_required(login_url="core:login")
def profile_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    return render(
        request,
        "profile.html",
        {
            "profile": profile,
            "user": request.user,
        },
    )


@login_required(login_url="core:login")
def manage_profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        middle_initial = request.POST.get("middle_initial", "").strip()
        phone_number = request.POST.get("phone_number", "").strip()
        bio = request.POST.get("bio", "").strip()

        avatar = request.FILES.get("avatar")
        avatar_removed = request.POST.get("avatar_removed")

        bucket_name = "avatars"
        file_extension = ""
        if avatar:
            file_extension = os.path.splitext(avatar.name)[1]

        full_file_path = f"users/{request.user.id}/avatar_final{file_extension}"

        if not first_name or not last_name or not username or not email:
            messages.error(
                request,
                "First name, last name, username, and email are required.",
            )
            return redirect("core:manage_profile")

        user = request.user
        user.first_name = first_name
        user.last_name = last_name
        user.username = username
        user.email = email

        try:
            user.save()
        except Exception as e:
            messages.error(request, f"Update failed: {e}")
            return redirect("core:manage_profile")

        profile.middle_initial = middle_initial
        profile.phone_number = phone_number
        profile.bio = bio

        # Avatar handling
        if avatar_removed == "true":
            placeholder_path = settings.STATIC_URL + "imgs/avatar_placeholder.jpg"
            profile.avatar_url = placeholder_path

        elif avatar:
            if not supabase:
                messages.error(request, "File storage service is unavailable.")
                return redirect("core:manage_profile")

            avatar.file.seek(0)
            file_content = avatar.file.read()

            try:
                supabase.storage.from_(bucket_name).update(
                    file=file_content,
                    path=full_file_path,
                    file_options={"content-type": avatar.content_type},
                )
            except Exception as e:
                # Fallback: upload if file doesn't exist yet
                try:
                    avatar.file.seek(0)
                    file_content = avatar.file.read()
                    supabase.storage.from_(bucket_name).upload(
                        file=file_content,
                        path=full_file_path,
                        file_options={"content-type": avatar.content_type},
                    )
                except Exception as upload_e:
                    print(f"Avatar upload error: {upload_e}")
                    messages.error(request, "Failed to upload profile picture.")
                    return redirect("core:manage_profile")

            base_url = supabase.storage.from_(bucket_name).get_public_url(
                full_file_path
            )
            if base_url.endswith("?"):
                base_url = base_url[:-1]
            public_url = f"{base_url}?cachebuster={int(time.time())}"
            profile.avatar_url = public_url

        profile.full_name = f"{first_name} {middle_initial} {last_name}".strip()
        profile.save()

        messages.success(request, "Profile updated successfully.")
        return redirect("core:profile")

    return render(
        request,
        "manage_profile.html",
        {"profile": profile, "user": request.user},
    )


# ---------- LISTINGS (CREATE / READ / UPDATE / DELETE) ----------

@contributor_required
def create_listing(request):
    profile = UserProfile.objects.get(user=request.user)

    if request.method == "POST":
        name = request.POST.get("name")
        location = request.POST.get("location")
        description = request.POST.get("description")

        
        wifi = request.POST.get("wifi") == "on"
        ac = request.POST.get("ac") == "on"
        free = request.POST.get("free") == "on"
        coffee = request.POST.get("coffee") == "on"
        outlets = request.POST.get("outlets") == "on"
        pastries = request.POST.get("pastries") == "on"

        
        open_24_7 = request.POST.get("open_24_7") == "on"
        opening_time = request.POST.get("opening_time")
        closing_time = request.POST.get("closing_time")

        
        lat = request.POST.get("lat")
        lng = request.POST.get("lng")

        
        images_uploaded = request.FILES.getlist("images")

        
        spot = StudySpot.objects.create(
            owner=request.user,
            name=name,
            location=location,
            description=description,

            wifi=wifi,
            ac=ac,
            free=free,
            coffee=coffee,
            outlets=outlets,
            pastries=pastries,
            open_24_7=open_24_7,

            
            opening_time=None if open_24_7 else opening_time,
            closing_time=None if open_24_7 else closing_time,

            lat=lat,
            lng=lng,
        )

        
        uploaded_urls = []
        for img in images_uploaded:
            public_url = upload_studyspot_image(img, spot.id)
            if public_url:
                uploaded_urls.append(public_url)

        spot.images = uploaded_urls
        spot.save()

        messages.success(request, "Listing successfully created!")
        return redirect("core:home")

    return render(request, "create_listing.html", {"profile": profile})



@contributor_required
def my_listings(request):
    my_listings = StudySpot.objects.filter(owner=request.user).order_by("-id")
    return render(request, "my_listings.html", {"my_listings": my_listings})


@contributor_required
def edit_listing(request, spot_id):
    profile = UserProfile.objects.get(user=request.user)
    spot = get_object_or_404(StudySpot, id=spot_id)

    # safety: only owner can edit
    if spot.owner != request.user:
        raise PermissionDenied("You are not authorized to edit this listing.")

    if request.method == "POST":
        # ---------- BASIC FIELDS ----------
        spot.name = request.POST.get("name", spot.name)
        spot.location = request.POST.get("location", spot.location)
        spot.description = request.POST.get("description", spot.description)

        # ---------- AMENITIES ----------
        spot.wifi = request.POST.get("wifi") == "on"
        spot.ac = request.POST.get("ac") == "on"
        spot.free = request.POST.get("free") == "on"
        spot.coffee = request.POST.get("coffee") == "on"
        spot.outlets = request.POST.get("outlets") == "on"
        spot.pastries = request.POST.get("pastries") == "on"
        spot.open_24_7 = request.POST.get("open_24_7") == "on"

        # ---------- OPENING HOURS ----------
        if spot.open_24_7:
            spot.opening_time = None
            spot.closing_time = None
        else:
            opening_time = request.POST.get("opening_time") or None
            closing_time = request.POST.get("closing_time") or None
            spot.opening_time = opening_time
            spot.closing_time = closing_time

        # ---------- LOCATION (LAT / LNG) ----------
        lat = request.POST.get("lat")
        lng = request.POST.get("lng")
        if lat:
            spot.lat = lat
        if lng:
            spot.lng = lng

        # ---------- IMAGES (MULTIPLE, JUST LIKE create_listing) ----------
        # input name="images" with multiple
        images_uploaded = request.FILES.getlist("images")

        if images_uploaded:
            uploaded_urls = []
            for img in images_uploaded:
                public_url = upload_studyspot_image(img, spot.id)
                if public_url:
                    uploaded_urls.append(public_url)

            if uploaded_urls:
                spot.images = uploaded_urls
                spot.image_url = uploaded_urls[0]

        spot.save()
        messages.success(request, "Listing updated successfully.")
        return redirect("core:my_listings")

    return render(
        request,
        "edit_listing.html",
        {"spot": spot, "profile": profile},
    )



@contributor_required
def delete_listing(request, id):
    spot = get_object_or_404(StudySpot, id=id)

    if spot.owner != request.user:
        messages.error(request, "You are not authorized to delete this listing.")
        return redirect("core:my_listings")

    if request.method == "POST":
        spot.delete()
        messages.success(request, "Listing successfully deleted.")

    return redirect("core:my_listings")


# ---------- STAFF APPLICATION ----------

@login_required
def apply_staff(request):
    profile = UserProfile.objects.get(user=request.user)
    application = StaffApplication.objects.filter(user=request.user).first()

    if request.method == "POST":
        form = StaffApplicationForm(request.POST, request.FILES, instance=application)
        if form.is_valid():
            app = form.save(commit=False)
            app.user = request.user
            app.status = "Pending"
            app.save()

            # optional: upload docs to "staff_docs" bucket if you want
            if supabase:
                file_fields = ["government_id", "proof_of_ownership", "proof_of_address"]
                for field_name in file_fields:
                    uploaded_file = request.FILES.get(field_name)
                    if uploaded_file:
                        path = f"staff_docs/{field_name}/{uploaded_file.name}"
                        file_content = uploaded_file.read()
                        supabase.storage.from_("staff_docs").upload(
                            path, file_content
                        )
                        public_url = supabase.storage.from_(
                            "staff_docs"
                        ).get_public_url(path)
                        setattr(app, field_name, public_url)
                app.save()

            return render(
                request,
                "apply_staff.html",
                {"submitted": True, "application": app},
            )

        return render(
            request,
            "apply_staff.html",
            {
                "form": form,
                "application": application,
                "error": "Please check your form fields and try again.",
            },
        )

    else:
        form = StaffApplicationForm(instance=application)

    return render(
        request,
        "apply_staff.html",
        {"form": form, "application": application, "profile": profile},
    )


# ---------- STUDYSPOT DETAIL / REVIEWS ----------

def studyspot_detail(request, spot_id):
    spot = get_object_or_404(StudySpot, id=spot_id)
    reviews = spot.reviews.all().order_by("-created_at")

    if request.method == "POST":
        if not request.user.is_authenticated:
            messages.error(request, "You must be logged in to post a review.")
            return redirect("core:login")

        form = ReviewForm(request.POST)
        if form.is_valid():
            if Review.objects.filter(spot=spot, user=request.user).exists():
                messages.error(
                    request,
                    "You have already submitted a review for this spot.",
                )
            else:
                review = form.save(commit=False)
                review.spot = spot
                review.user = request.user
                review.save()
                spot.update_average_rating()
                messages.success(request, "Your review has been submitted!")
                return redirect("core:studyspot_detail", spot_id=spot.id)
        else:
            messages.error(request, "There was an error with your submission.")
    else:
        form = ReviewForm()

    return render(
        request,
        "studyspot_detail.html",
        {"spot": spot, "reviews": reviews, "form": form},
    )


def trending_studyspots(request):
    trending_spots = StudySpot.objects.filter(is_trending=True)
    return render(
        request,
        "core/trending.html",
        {"trending_spots": trending_spots},
    )


# ---------- AJAX USERNAME UNIQUENESS ----------

from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def check_username_uniqueness(request):
    try:
        data = json.loads(request.body)
        username_to_check = data.get("username", "").strip()
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    current_username = request.user.username

    if not username_to_check:
        return JsonResponse({"is_available": True}, status=200)

    if username_to_check == current_username:
        return JsonResponse(
            {"is_available": True, "message": "Username is the same."},
            status=200,
        )

    try:
        if User.objects.filter(username__iexact=username_to_check).exists():
            is_available = False
            message = "Username already taken."
        else:
            is_available = True
            message = "Username is available."

        return JsonResponse(
            {"is_available": is_available, "message": message}, status=200
        )
    except Exception as e:
        print(f"Database Query Error: {e}")
        return JsonResponse(
            {"error": "Database error during availability check."}, status=500
        )
