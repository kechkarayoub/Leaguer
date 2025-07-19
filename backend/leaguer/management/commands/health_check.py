"""
Management command for checking system health and configuration.
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.utils import timezone
import os
import sys


class Command(BaseCommand):
    help = 'Check system health and configuration'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output',
        )
        parser.add_argument(
            '--check-db',
            action='store_true',
            help='Check database connection',
        )
        parser.add_argument(
            '--check-cache',
            action='store_true',
            help='Check cache system',
        )
        parser.add_argument(
            '--check-files',
            action='store_true',
            help='Check file system permissions',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Run all checks',
        )
    
    def handle(self, *args, **options):
        verbose = options['verbose']
        
        if options['all']:
            self.check_all(verbose)
        else:
            if options['check_db']:
                self.check_database(verbose)
            if options['check_cache']:
                self.check_cache(verbose)
            if options['check_files']:
                self.check_files(verbose)
            
            # Default behavior - show basic info
            if not any([options['check_db'], options['check_cache'], options['check_files']]):
                self.show_basic_info(verbose)
    
    def check_all(self, verbose=False):
        """Run all health checks."""
        self.stdout.write(self.style.SUCCESS("Running comprehensive system health check..."))
        self.stdout.write("")
        
        self.show_basic_info(verbose)
        self.check_database(verbose)
        self.check_cache(verbose)
        self.check_files(verbose)
        self.check_configuration(verbose)
        
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Health check completed!"))
    
    def show_basic_info(self, verbose=False):
        """Show basic system information."""
        self.stdout.write(self.style.HTTP_INFO("=== System Information ==="))
        self.stdout.write(f"Application: {settings.APPLICATION_NAME}")
        self.stdout.write(f"Environment: {settings.ENVIRONMENT}")
        self.stdout.write(f"Debug Mode: {settings.DEBUG}")
        self.stdout.write(f"Python Version: {sys.version}")
        self.stdout.write(f"Django Version: {self.get_django_version()}")
        self.stdout.write(f"Time Zone: {settings.TIME_ZONE}")
        self.stdout.write(f"Current Time: {timezone.now()}")
        self.stdout.write("")
    
    def check_database(self, verbose=False):
        """Check database connection."""
        self.stdout.write(self.style.HTTP_INFO("=== Database Check ==="))
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                
            if result:
                self.stdout.write(self.style.SUCCESS("✓ Database connection: OK"))
                if verbose:
                    db_config = settings.DATABASES['default']
                    self.stdout.write(f"  Engine: {db_config['ENGINE']}")
                    self.stdout.write(f"  Host: {db_config['HOST']}")
                    self.stdout.write(f"  Port: {db_config['PORT']}")
                    self.stdout.write(f"  Database: {db_config['NAME']}")
            else:
                self.stdout.write(self.style.ERROR("✗ Database connection: FAILED"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Database connection: ERROR - {str(e)}"))
        
        self.stdout.write("")
    
    def check_cache(self, verbose=False):
        """Check cache system."""
        self.stdout.write(self.style.HTTP_INFO("=== Cache Check ==="))
        
        try:
            test_key = 'health_check_test'
            test_value = 'test_value'
            
            cache.set(test_key, test_value, 60)
            retrieved_value = cache.get(test_key)
            
            if retrieved_value == test_value:
                self.stdout.write(self.style.SUCCESS("✓ Cache system: OK"))
                if verbose:
                    cache_config = settings.CACHES['default']
                    self.stdout.write(f"  Backend: {cache_config['BACKEND']}")
                    if 'LOCATION' in cache_config:
                        self.stdout.write(f"  Location: {cache_config['LOCATION']}")
            else:
                self.stdout.write(self.style.ERROR("✗ Cache system: FAILED"))
                
            cache.delete(test_key)
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Cache system: ERROR - {str(e)}"))
        
        self.stdout.write("")
    
    def check_files(self, verbose=False):
        """Check file system permissions."""
        self.stdout.write(self.style.HTTP_INFO("=== File System Check ==="))
        
        # Check media directory
        media_root = getattr(settings, 'MEDIA_ROOT', None)
        if media_root:
            if os.path.exists(media_root):
                if os.access(media_root, os.W_OK):
                    self.stdout.write(self.style.SUCCESS("✓ Media directory: OK"))
                else:
                    self.stdout.write(self.style.ERROR("✗ Media directory: NOT WRITABLE"))
            else:
                self.stdout.write(self.style.WARNING("⚠ Media directory: NOT FOUND"))
        
        # Check static directory
        static_root = getattr(settings, 'STATIC_ROOT', None)
        if static_root and os.path.exists(static_root):
            if os.access(static_root, os.R_OK):
                self.stdout.write(self.style.SUCCESS("✓ Static directory: OK"))
            else:
                self.stdout.write(self.style.ERROR("✗ Static directory: NOT READABLE"))
        
        # Check logs directory
        logs_dir = os.path.join(settings.BASE_DIR, 'logs')
        if os.path.exists(logs_dir):
            if os.access(logs_dir, os.W_OK):
                self.stdout.write(self.style.SUCCESS("✓ Logs directory: OK"))
            else:
                self.stdout.write(self.style.ERROR("✗ Logs directory: NOT WRITABLE"))
        else:
            self.stdout.write(self.style.WARNING("⚠ Logs directory: NOT FOUND"))
        
        # Check Firebase credentials
        firebase_creds = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
        if firebase_creds:
            if os.path.exists(firebase_creds):
                self.stdout.write(self.style.SUCCESS("✓ Firebase credentials: OK"))
            else:
                self.stdout.write(self.style.ERROR("✗ Firebase credentials: NOT FOUND"))
        
        self.stdout.write("")
    
    def check_configuration(self, verbose=False):
        """Check configuration settings."""
        self.stdout.write(self.style.HTTP_INFO("=== Configuration Check ==="))
        
        # Check required settings
        required_settings = [
            'SECRET_KEY',
            'DATABASES',
            'INSTALLED_APPS',
            'MIDDLEWARE',
        ]
        
        for setting_name in required_settings:
            if hasattr(settings, setting_name):
                value = getattr(settings, setting_name)
                if value:
                    self.stdout.write(self.style.SUCCESS(f"✓ {setting_name}: OK"))
                else:
                    self.stdout.write(self.style.ERROR(f"✗ {setting_name}: EMPTY"))
            else:
                self.stdout.write(self.style.ERROR(f"✗ {setting_name}: NOT SET"))
        
        # Check security settings in production
        if settings.ENVIRONMENT == 'production':
            if settings.DEBUG:
                self.stdout.write(self.style.ERROR("✗ DEBUG should be False in production"))
            else:
                self.stdout.write(self.style.SUCCESS("✓ DEBUG: OK for production"))
            
            if settings.ALLOWED_HOSTS == ['*']:
                self.stdout.write(self.style.WARNING("⚠ ALLOWED_HOSTS allows all hosts"))
            else:
                self.stdout.write(self.style.SUCCESS("✓ ALLOWED_HOSTS: OK"))
        
        self.stdout.write("")
    
    def get_django_version(self):
        """Get Django version."""
        try:
            import django
            return django.get_version()
        except ImportError:
            return "Unknown"
