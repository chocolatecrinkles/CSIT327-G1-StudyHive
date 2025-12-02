from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from .models import StaffApplication
from .models import StudySpot
from django import forms
from .models import Review  

COMMON_INPUT_CLASSES = (
    "w-full rounded-md border-2 border-[#8BC29A] bg-white text-slate-800 "
    "px-4 py-2.5 font-[Nunito_Sans] text-[0.95rem] font-medium "
    "placeholder:text-gray-400 focus:outline-none focus:border-yellow-300 "
    "focus:ring-4 focus:ring-yellow-100 transition-all duration-200"
)
 
LABEL_CLASSES = (
    "block text-sm font-[Nunito_Sans] font-bold text-[#4B4B4B] tracking-wide mb-1 capitalize"
)
class StudySpotForm(forms.ModelForm):
    class Meta:
        model = StudySpot
        fields = [
            "name",
            "location",
            "description",
            "wifi",
            "ac",
            "free",
            "coffee",
            "open_24_7",
            "outlets",
            "pastries",
            "is_trending",
        ]

        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g., Workplace Café, Rizal Library'}),
            'location': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter exact address or area'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Describe the vibe, noise level, and best features...'}),
            'image': forms.FileInput(attrs={'class': 'form-control'}),
            'wifi': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'open_24_7': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'outlets': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'coffee': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'ac': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'pastries': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }





class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            "class": COMMON_INPUT_CLASSES,
            "placeholder": "Enter your email",
        })
    )

    password1 = forms.CharField(
        label="Password",
        widget=forms.PasswordInput(attrs={
            "class": COMMON_INPUT_CLASSES,
            "placeholder": "Enter password",
        })
    )

    password2 = forms.CharField(
        label="Confirm Password",
        widget=forms.PasswordInput(attrs={
            "class": COMMON_INPUT_CLASSES,
            "placeholder": "Confirm password",
        })
    )

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")
        widgets = {
            "username": forms.TextInput(attrs={
                "class": COMMON_INPUT_CLASSES,
                "placeholder": "Choose a username",
            }),
        }

    # Optional: If you want Django to render your labels with that style automatically
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            field.label_suffix = ""
            field.widget.attrs["autocomplete"] = "off"
            field.widget.attrs["aria-label"] = field.label
            field.label_tag = lambda *a, **kw: f'<label class="{LABEL_CLASSES}" for="{field.id_for_label}">{field.label}</label>'


class CustomAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            "class": COMMON_INPUT_CLASSES,
            "placeholder": "Enter your username or email",
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            "class": COMMON_INPUT_CLASSES,
            "placeholder": "Enter your password",
        })
    )


class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['rating', 'comment']
        widgets = {
            # --- THIS IS THE CHANGE ---
            'rating': forms.HiddenInput(attrs={
                'id': 'id_rating_input', # Add an ID for JS
            }),
            'comment': forms.Textarea(attrs={
                'rows': 4,
                'placeholder': 'Share your experience...'
            }),
        }


class StaffApplicationForm(forms.ModelForm):
    class Meta:
        model = StaffApplication
        fields = [
            # Personal Info
            'full_name', 'email', 'phone_number', 'government_id',
            # Study Place Info
            'study_place_name', 'study_place_address', 'study_place_website',
            'business_registration_number', 'proof_of_ownership', 'role_description',
            # Address & Social
            'proof_of_address', 'social_media_links'
        ]
        widgets = {
            'full_name': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Enter full name'}),
            'email': forms.EmailInput(attrs={'class': 'form-input', 'placeholder': 'Enter your email'}),
            'phone_number': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Enter contact number'}),
            'study_place_name': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Name of study place'}),
            'study_place_address': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Complete address'}),
            'study_place_website': forms.URLInput(attrs={'class': 'form-input', 'placeholder': 'Website (optional)'}),
            'business_registration_number': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Optional'}),
            'role_description': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'e.g., Manager, Owner'}),
            'social_media_links': forms.Textarea(attrs={'class': 'form-input', 'rows': 2, 'placeholder': 'Links separated by commas'}),
        }


       
