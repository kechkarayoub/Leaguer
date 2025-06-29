// AppSplashScreen: A splash/loading screen with logo, app name, and optional loader.
// Shows a centered logo (max 80% width, 60% height, up to 300x300), app name, and a loader if desired.
// Usage: AppSplashScreen(appName: 'MyApp', showLoader: true)

import 'package:flutter/material.dart';
import 'package:frontend/utils/styles_variables.dart';

class AppSplashScreen extends StatelessWidget {
  /// Whether to show the loading spinner below the logo and app name.
  final bool showLoader;
  /// The app name to display below the logo. If empty, no name is shown.
  final String appName;
  final Map<String, dynamic>? arguments;
  const AppSplashScreen({super.key, required this.appName, this.showLoader = true, this.arguments});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: primaryColor,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Responsive logo: max 80% width, 60% height, up to 300x300
            LayoutBuilder(
              builder: (context, constraints) {
                final maxWidth = constraints.maxWidth * 0.8;
                final maxHeight = constraints.maxHeight * 0.6;
                return Image.asset(
                  'assets/images/logo_main.png',
                  width: maxWidth.clamp(0, 300),
                  height: maxHeight.clamp(0, 300),
                  fit: BoxFit.contain,
                );
              },
            ),
            // App name (if provided)
            if(appName.isNotEmpty) 
              const SizedBox(height: 24),
            if(appName.isNotEmpty)
              Text(
                appName,
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: primaryTextTitleColor, // or your brand color
                  letterSpacing: 1.2,
                ),
              ),
            // Optional loading spinner
            if (showLoader) 
              const SizedBox(height: 32),
            if (showLoader) 
              const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}