from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg, Q
import time

# --- 1. MANAGERS ---
class CheckInManager(models.Manager):
    """Custom manager to easily fetch active checkins."""
    def active_only(self):
        return self.filter(is_active=True)

# --- 2. CORE MODELS ---


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100, blank=True, null=True)  # ✅ make optional
    middle_initial = models.CharField(max_length=1, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.CharField(max_length=500, blank=True, null=True)

    is_contributor = models.BooleanField(default=False)


    def __str__(self):
        return self.user.username

class StudySpot(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    description = models.TextField()

    wifi = models.BooleanField(default=False)
    ac = models.BooleanField(default=False)
    free = models.BooleanField(default=False)
    coffee = models.BooleanField(default=False)

    images = models.JSONField(default=list, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')

    open_24_7 = models.BooleanField(default=False)
    outlets = models.BooleanField(default=False)
    pastries = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)

    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)

    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)

    def update_average_rating(self):
        average = self.reviews.aggregate(Avg('rating'))['rating__avg']
        self.average_rating = round(average or 0, 2)
        self.save()


class StaffApplication(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Personal Info
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone_number = models.CharField(max_length=20)
    government_id = models.CharField(max_length=500, blank=True, null=True)
    
    # Study Place Info
    study_place_name = models.CharField(max_length=150)
    study_place_address = models.CharField(max_length=255)
    study_place_website = models.URLField(blank=True, null=True)
    business_registration_number = models.CharField(max_length=100, blank=True, null=True)
    proof_of_ownership = models.CharField(max_length=500, blank=True, null=True)
    role_description = models.CharField(max_length=100)
    proof_of_address = models.CharField(max_length=500, blank=True, null=True)

    social_media_links = models.TextField(blank=True, null=True)
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('Pending', 'Pending'),
            ('Approved', 'Approved'),
            ('Rejected', 'Rejected'),
        ],
        default='Pending'
    )

    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.status})"


class Review(models.Model):
    spot = models.ForeignKey(StudySpot, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # This is the database constraint from your sub-tasks.
        # It ensures a user can only write one review per spot.
        unique_together = ('spot', 'user')

    def __str__(self):
        return f"{self.user.username}'s review for {self.spot.name}"
    


# --- 3. CHECKIN MODEL ---

class CheckIn(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='checkins')
    spot = models.ForeignKey(StudySpot, on_delete=models.CASCADE, related_name='active_users')
    check_in_time = models.DateTimeField(auto_now_add=True)
    
    is_active = models.BooleanField(default=True) 
    objects = CheckInManager()
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user'], 
                condition=Q(is_active=True), 
                name='unique_active_checkin'
            )
        ]

    def __str__(self):
        status = "Checked In" if self.is_active else "Checked Out"
        return f"{self.user.username} @ {self.spot.name} ({status})"