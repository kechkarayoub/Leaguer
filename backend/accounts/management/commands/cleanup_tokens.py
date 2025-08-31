"""
Management command to clean up expired and blacklisted tokens.
"""
import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import (BlacklistedToken,
                                                             OutstandingToken)

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    """
    Management command to clean up expired and blacklisted tokens.
    """
    help = 'Clean up expired and blacklisted JWT tokens'
    # Ex use: python manage.py cleanup_tokens -d 30 -f
    def add_arguments(self, parser):
        parser.add_argument(
            '-d',
            '--days',
            type=int,
            default=7,
            help='Remove tokens older than this many days (default: 7)',
        )
        parser.add_argument(
            '-f',
            '--force',
            action='store_true',
            help='Force cleanup without confirmation',
        )

    def handle(self, *args, **options):
        days = options['days']
        cutoff_date = timezone.now() - timedelta(days=days)
        # Count tokens to be removed
        expired_outstanding = OutstandingToken.objects.filter(
            created_at__lt=cutoff_date
        )
        expired_blacklisted = BlacklistedToken.objects.filter(
            token__created_at__lt=cutoff_date
        )
        outstanding_count = expired_outstanding.count()
        blacklisted_count = expired_blacklisted.count()
        total_count = outstanding_count + blacklisted_count
        if total_count == 0:
            self.stdout.write(
                self.style.SUCCESS("No expired tokens found to clean up")
            )
            return
        self.stdout.write(
            f"Found {outstanding_count} expired outstanding tokens"
        )
        self.stdout.write(
            f"Found {blacklisted_count} expired blacklisted tokens"
        )
        self.stdout.write(
            f"Total tokens to remove: {total_count}"
        )
        # Confirmation
        if not options['force']:
            confirm = input(
                f"Are you sure you want to remove {total_count} expired tokens older than {days} days? [y/N]: "
            )
            if confirm.lower() not in ['y', 'yes']:
                self.stdout.write("Operation cancelled")
                return
        # Remove expired tokens
        try:
            blacklisted_deleted = expired_blacklisted.delete()[0]
            outstanding_deleted = expired_outstanding.delete()[0]
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Removed {blacklisted_deleted} expired blacklisted tokens"
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Removed {outstanding_deleted} expired outstanding tokens"
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Total tokens cleaned up: {blacklisted_deleted + outstanding_deleted}"
                )
            )
            logger.info(
                "Token cleanup completed: %d tokens removed", blacklisted_deleted + outstanding_deleted
            )
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error during token cleanup: %s", e)
            self.stdout.write(
                self.style.ERROR(f"Error during cleanup: {e}")
            )
