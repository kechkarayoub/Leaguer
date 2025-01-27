import 'package:flutter/material.dart';
import 'package:frontend/utils/utils.dart';

/// A widget that displays a circular avatar with initials and a background color.

class InitialsAvatar extends StatelessWidget {
  /// A stateless widget that displays a circular avatar containing initials.
  ///
  /// Parameters:
  /// - `initials`: The initials to display.
  /// - `initialsBgColors`: The background color of the avatar in hexadecimal format.

  final String initials;
  final String initialsBgColors;

  const InitialsAvatar({super.key, required this.initials, required this.initialsBgColors});

  @override
  Widget build(BuildContext context) {
    /// Builds the circular initials avatar.
    ///
    /// Returns:
    /// - A `Container` with a circular shape, a background color, and centered initials.

    
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: hexToColor(initialsBgColors),
      ),
      child: Center(
        child: Text(
          initials.toUpperCase(),
          style: TextStyle(
            color: Colors.white,
            fontSize: 40,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
