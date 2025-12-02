from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailOrUsernameBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)

        # Try matching email
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            # If email doesn't match, try username
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None

        # Check password
        if user.check_password(password):
            return user

        return None
