"""
Management command to logout users by blacklisting their tokens.
"""
import logging

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from rest_framework_simplejwt.token_blacklist.models import (BlacklistedToken,
                                                             OutstandingToken)

from accounts.models import User
from accounts.tokens import RefreshToken

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Logout users by blacklisting their JWT tokens'

    # Ex use: python manage.py logout_users -ui 1 -f

    def add_arguments(self, parser):
        parser.add_argument(
            '-ui',
            '--user-id',
            type=int,
            help='Logout specific user by ID',
        )
        parser.add_argument(
            '-u',
            '--username',
            type=str,
            help='Logout specific user by username',
        )
        parser.add_argument(
            '-e',
            '--email',
            type=str,
            help='Logout specific user by email',
        )
        parser.add_argument(
            '-a',
            '--all-users',
            action='store_true',
            help='Logout all users',
        )
        parser.add_argument(
            '-iu',
            '--inactive-users',
            action='store_true',
            help='Logout all inactive users',
        )
        parser.add_argument(
            '-f',
            '--force',
            action='store_true',
            help='Force logout without confirmation',
        )

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Determine which users to logout
        users_to_logout = []
        
        if options['user_id']:
            try:
                user = User.objects.get(id=options['user_id'])
                users_to_logout = [user]
                self.stdout.write(f"Found user: {user.username} ({user.email})")
            except User.DoesNotExist:
                raise CommandError(f"User with ID {options['user_id']} does not exist")
                
        elif options['username']:
            try:
                user = User.objects.get(username=options['username'])
                users_to_logout = [user]
                self.stdout.write(f"Found user: {user.username} ({user.email})")
            except User.DoesNotExist:
                raise CommandError(f"User with username '{options['username']}' does not exist")
                
        elif options['email']:
            try:
                user = User.objects.get(email=options['email'])
                users_to_logout = [user]
                self.stdout.write(f"Found user: {user.username} ({user.email})")
            except User.DoesNotExist:
                raise CommandError(f"User with email '{options['email']}' does not exist")
                
        elif options['all_users']:
            users_to_logout = list(User.objects.filter(is_active=True))
            self.stdout.write(f"Found {len(users_to_logout)} active users")
            
        elif options['inactive_users']:
            users_to_logout = list(User.objects.filter(is_active=False))
            self.stdout.write(f"Found {len(users_to_logout)} inactive users")
            
        else:
            raise CommandError("You must specify one of: --user-id/--ui, --username/-u, --email/-e, --all-users/-a, or --inactive-users/-iu")

        if not users_to_logout:
            self.stdout.write(self.style.WARNING("No users found to logout"))
            return

        # Confirmation
        if not options['force']:
            if len(users_to_logout) == 1:
                confirm = input(f"Are you sure you want to logout user '{users_to_logout[0].username}'? [y/N]: ")
            else:
                confirm = input(f"Are you sure you want to logout {len(users_to_logout)} users? [y/N]: ")
            
            if confirm.lower() not in ['y', 'yes']:
                self.stdout.write("Operation cancelled")
                return

        # Logout users
        total_tokens_blacklisted = 0
        
        for user in users_to_logout:
            nbr_tokens_blacklisted = self.logout_user(user)
            total_tokens_blacklisted += nbr_tokens_blacklisted

            if nbr_tokens_blacklisted > 0:
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Logged out user '{user.username}' ({nbr_tokens_blacklisted} tokens blacklisted)")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"⚠ User '{user.username}' had no active tokens")
                )

        self.stdout.write(
            self.style.SUCCESS(f"\nCompleted! Total tokens blacklisted: {total_tokens_blacklisted}")
        )

    def logout_user(self, user):
        """
        Logout a specific user by blacklisting all their outstanding tokens.
        
        Args:
            user: User instance to logout
            
        Returns:
            int: Number of tokens blacklisted
        """
        nbr_tokens_blacklisted = 0
        
        try:
            # Get all outstanding tokens for this user
            outstanding_tokens = OutstandingToken.objects.filter(user=user)
            
            for outstanding_token in outstanding_tokens:
                # Check if token is already blacklisted
                if not BlacklistedToken.objects.filter(token=outstanding_token).exists():
                    # Blacklist the token
                    BlacklistedToken.objects.create(token=outstanding_token)
                    nbr_tokens_blacklisted += 1
                    logger.info(f"Blacklisted token for user {user.username}")
            
        except Exception as e:
            logger.error(f"Error logging out user {user.username}: {str(e)}")
            self.stdout.write(
                self.style.ERROR(f"Error logging out user '{user.username}': {str(e)}")
            )

        return nbr_tokens_blacklisted
