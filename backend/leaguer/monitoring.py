"""
Performance monitoring and profiling utilities.
"""

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from functools import wraps
import logging
import time


logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Performance monitoring utility."""
    
    @staticmethod
    def time_function(func_name=None):
        """
        Decorator to measure function execution time.
        
        Args:
            func_name (str, optional): Custom function name for logging
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                name = func_name or f"{func.__module__}.{func.__name__}"
                start_time = time.time()
                
                try:
                    result = func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    
                    # Log performance metrics
                    logger.info(f"Performance: {name} executed in {execution_time:.4f}s")
                    
                    # Store in cache for monitoring
                    if hasattr(settings, 'PERFORMANCE_MONITORING') and settings.PERFORMANCE_MONITORING:
                        cache_key = f"perf_monitor:{name}"
                        cache.set(cache_key, {
                            'execution_time': execution_time,
                            'timestamp': timezone.now().isoformat(),
                            'success': True
                        }, timeout=3600)
                    
                    return result
                    
                except Exception as e:
                    execution_time = time.time() - start_time
                    logger.error(f"Performance: {name} failed after {execution_time:.4f}s - {str(e)}")
                    
                    # Store failure in cache
                    if hasattr(settings, 'PERFORMANCE_MONITORING') and settings.PERFORMANCE_MONITORING:
                        cache_key = f"perf_monitor:{name}"
                        cache.set(cache_key, {
                            'execution_time': execution_time,
                            'timestamp': timezone.now().isoformat(),
                            'success': False,
                            'error': str(e)
                        }, timeout=3600)
                    
                    raise
                    
            return wrapper
        return decorator
    
    @staticmethod
    def get_performance_metrics(function_name=None):
        """
        Get performance metrics for a function.
        
        Args:
            function_name (str, optional): Specific function name
            
        Returns:
            dict: Performance metrics
        """
        if function_name:
            cache_key = f"perf_monitor:{function_name}"
            return cache.get(cache_key)
        
        # Return all performance metrics
        # This is a simplified implementation
        # In production, you'd want to use a proper monitoring system
        return {}
    
    @staticmethod
    def log_slow_queries(threshold=1.0):
        """
        Log slow database queries.
        
        Args:
            threshold (float): Threshold in seconds
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                from django.db import connection
                
                queries_before = len(connection.queries)
                start_time = time.time()
                
                result = func(*args, **kwargs)
                
                execution_time = time.time() - start_time
                queries_after = len(connection.queries)
                num_queries = queries_after - queries_before
                
                if execution_time > threshold:
                    logger.warning(
                        f"Slow operation: {func.__name__} took {execution_time:.4f}s "
                        f"with {num_queries} queries"
                    )
                
                return result
            return wrapper
        return decorator


class DatabaseMonitor:
    """Database performance monitoring."""
    
    @staticmethod
    def get_connection_info():
        """Get database connection information."""
        from django.db import connection
        
        return {
            'vendor': connection.vendor,
            'queries_count': len(connection.queries),
            'total_time': sum(float(q['time']) for q in connection.queries),
        }
    
    @staticmethod
    def log_query_count(threshold=10):
        """
        Log functions that execute too many queries.
        
        Args:
            threshold (int): Maximum number of queries allowed
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                from django.db import connection
                
                queries_before = len(connection.queries)
                result = func(*args, **kwargs)
                queries_after = len(connection.queries)
                
                query_count = queries_after - queries_before
                
                if query_count > threshold:
                    logger.warning(
                        f"High query count: {func.__name__} executed {query_count} queries "
                        f"(threshold: {threshold})"
                    )
                
                return result
            return wrapper
        return decorator


class CacheMonitor:
    """Cache performance monitoring."""
    
    @staticmethod
    def monitor_cache_hit_rate():
        """Monitor cache hit rates."""
        # This would require a more sophisticated cache backend
        # For now, we'll just log cache operations
        pass
    
    @staticmethod
    def log_cache_misses(cache_key_prefix):
        """
        Log cache misses for monitoring.
        
        Args:
            cache_key_prefix (str): Prefix for cache keys to monitor
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                result = func(*args, **kwargs)
                
                # Log cache miss
                logger.info(f"Cache miss for {cache_key_prefix}: {func.__name__}")
                
                return result
            return wrapper
        return decorator


# Convenience decorators
performance_monitor = PerformanceMonitor.time_function()
slow_query_monitor = PerformanceMonitor.log_slow_queries()
query_count_monitor = DatabaseMonitor.log_query_count()


# Example usage in views or functions:
# @performance_monitor
# @slow_query_monitor
# def my_function():
#     # Your code here
#     pass
