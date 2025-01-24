from .models import User
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _


class UserAdmin(BaseUserAdmin):
    """
    Custom admin for the User model with added field names and configuration.
    """
    # Fields to display in the admin list view
    list_display = (
        'id', 'username', 'email', 'last_name', 'first_name', 'is_active', 'is_user_deleted', 'user_phone_number'
    )
    # Fields to filter by in the sidebar
    list_filter = ('is_active', 'is_user_email_validated', 'is_user_deleted', 'is_user_phone_number_validated')
    # Fields to search by
    search_fields = ('username', 'email', 'first_name', 'last_name', 'user_phone_number', 'user_phone_number_to_verify', 'user_cin')
    # Fields to display in the detailed edit view
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        (_('Personal Info'), {
            'fields': (
                'first_name', 'last_name', 'email', 'user_phone_number', 'user_birthday', 'user_gender', 'user_address',
                'user_country', 'current_language', 'user_phone_number_to_verify', 'user_phone_number_verified_by',
                'user_timezone'
            )
        }),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_user_email_validated', 'is_user_deleted', 'is_user_phone_number_validated', 'is_staff',
                'is_superuser', 'groups', 'user_permissions', 'user_phone_number_verification_code',
                'nbr_phone_number_verification_code_used',
            )
        }),
        (_('Important Dates'), {
            'fields': ('last_login', 'date_joined', 'user_phone_number_verification_code_generated_at')
        }),
    )
    # Fields to use for adding a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email', 'first_name', 'last_name', 'is_active'),
        }),
    )
    # Controls the default ordering of the list view
    ordering = ('last_name', 'first_name')
    # Pagination for the admin list view
    list_per_page = 25


# Register the custom User model with the custom UserAdmin
admin.site.register(User, UserAdmin)
