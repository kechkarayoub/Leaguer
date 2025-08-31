""" Accounts app admin"""
import logging

from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.token_blacklist.models import (BlacklistedToken,
                                                             OutstandingToken)

from .models import User

logger = logging.getLogger(__name__)


class UserAdmin(BaseUserAdmin):
    """
    Custom admin for the User model with added field names and configuration.
    """
    # Fields to display in the admin list view
    list_display = (
        'id', 'username', 'email', 'last_name', 'first_name', 'is_active',
        'is_user_deleted', 'user_phone_number'
    )
    # Fields to filter by in the sidebar
    list_filter = ('is_active', 'is_user_email_validated', 'is_user_deleted',
                   'is_user_phone_number_validated')
    # Fields to search by
    search_fields = ('username', 'email', 'first_name', 'last_name', 'user_phone_number',
                     'user_phone_number_to_verify', 'user_cin')
    # Fields to display in the detailed edit view
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        (_('Personal Info'), {
            'fields': (
                'first_name', 'last_name', 'email', 'user_phone_number', 'user_birthday',
                'user_gender', 'user_address', 'user_country', 'current_language',
                'user_phone_number_to_verify', 'user_phone_number_verified_by',
                'user_timezone', 'user_initials_bg_color', 'user_image_url'
            )
        }),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_user_email_validated', 'is_user_deleted',
                'is_user_phone_number_validated', 'is_staff',
                'is_superuser', 'groups', 'user_permissions',
                'user_phone_number_verification_code',
                'nbr_phone_number_verification_code_used',
            )
        }),
        (_('Important Dates'), {
            'fields': ('last_login', 'date_joined'
                       'user_phone_number_verification_code_generated_at')
        }),
    )
    # Fields to use for adding a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email', 'first_name',
                       'last_name', 'is_active'),
        }),
    )
    # Controls the default ordering of the list view
    ordering = ('last_name', 'first_name')
    # Pagination for the admin list view
    list_per_page = 25
    # Add custom actions
    actions = ['logout_selected_users', 'deactivate_and_logout_users']
    def logout_selected_users(self, request, queryset):
        """
        Admin action to logout selected users by blacklisting their tokens.
        """
        total_tokens_blacklisted = 0
        users_logged_out = 0
        for user in queryset:
            tokens_blacklisted = self._logout_user(user)
            total_tokens_blacklisted += tokens_blacklisted
            if tokens_blacklisted > 0:
                users_logged_out += 1
        if users_logged_out > 0:
            messages.success(
                request,
                f"Successfully logged out {users_logged_out} user(s). "
                f"Total tokens blacklisted: {total_tokens_blacklisted}"
            )
        else:
            messages.warning(
                request,
                "No active tokens found for the selected users."
            )
        logger.info("Admin action: %s users logged out by %s",
                    users_logged_out, request.user.username)
    logout_selected_users.short_description = _("Logout selected users (blacklist tokens)")
    def deactivate_and_logout_users(self, request, queryset):
        """
        Admin action to deactivate and logout selected users.
        """
        total_tokens_blacklisted = 0
        users_processed = 0
        for user in queryset:
            if user.is_active:
                user.is_active = False
                user.save()
                tokens_blacklisted = self._logout_user(user)
                total_tokens_blacklisted += tokens_blacklisted
                users_processed += 1
        if users_processed > 0:
            messages.success(
                request,
                f"Successfully deactivated and logged out {users_processed} user(s). "
                f"Total tokens blacklisted: {total_tokens_blacklisted}"
            )
        else:
            messages.warning(
                request,
                "No active users were found in the selection."
            )
        logger.info("Admin action: %s users deactivated and logged out by %s",
                    users_processed, request.user.username)
    deactivate_and_logout_users.short_description = _("Deactivate and logout "
                                                      "selected users")
    def _logout_user(self, user):
        """
        Helper method to logout a specific user by blacklisting their tokens.
        
        Args:
            user: User instance to logout
            
        Returns:
            int: Number of tokens blacklisted
        """
        tokens_blacklisted = 0
        try:
            # Get all outstanding tokens for this user
            outstanding_tokens = OutstandingToken.objects.filter(user=user)
            for outstanding_token in outstanding_tokens:
                # Check if token is already blacklisted
                if not BlacklistedToken.objects.filter(token=outstanding_token).exists():
                    # Blacklist the token
                    BlacklistedToken.objects.create(token=outstanding_token)
                    tokens_blacklisted += 1
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error logging out user %s: %s", user.username, str(e))
        return tokens_blacklisted

# Register the custom User model with the custom UserAdmin
admin.site.register(User, UserAdmin)
