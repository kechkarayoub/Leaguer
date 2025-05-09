
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;



/// Enum to represent the different platform types
enum PlatformType {android, desktop, ios, linux, macOs, mobile, web, windows}

/// Detects the current platform with various specificity options
///
/// [returnSpecificPlatform]: When true, returns the most specific platform type
///   (e.g., PlatformType.android instead of PlatformType.mobile). When false,
///   returns general categories (mobile/desktop/web). Defaults to false.
///
/// [defaultPlatform]: The fallback platform type to return if platform detection
///   fails (e.g., in test environments). Defaults to PlatformType.mobile.
///
/// Returns:
/// - PlatformType.web for web platforms
/// - PlatformType.mobile or specific mobile OS (android/ios) for mobile devices
/// - PlatformType.desktop or specific desktop OS (windows/macOs/linux) for desktops
/// - The specified default platform or mobile if detection fails
PlatformType getPlatformType({bool returnSpecificPlatform = false, PlatformType? defaultPlatform,}) {
  // Check if the platform is Web (highest priority)
  if (kIsWeb) return PlatformType.web;

  try {
    // Mobile platform detection
    if (Platform.isAndroid) {
      return returnSpecificPlatform ? PlatformType.android : PlatformType.mobile;
    }
    if (Platform.isIOS) {
      return returnSpecificPlatform ? PlatformType.ios : PlatformType.mobile;
    }

    // Desktop platform detection
    if (Platform.isWindows) {
      return returnSpecificPlatform ? PlatformType.windows : PlatformType.desktop;
    }
    if (Platform.isMacOS) {
      return returnSpecificPlatform ? PlatformType.macOs : PlatformType.desktop;
    }
    if (Platform.isLinux) {
      return returnSpecificPlatform ? PlatformType.linux : PlatformType.desktop;
    }
  } catch (_) {
    // Platform might not be available in test environments
  }

  // Fallback to default platform or mobile if detection fails
  return defaultPlatform ?? PlatformType.mobile;
}
