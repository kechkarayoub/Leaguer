import 'package:flutter/material.dart';
import 'package:frontend/utils/utils.dart';

class InitialsAvatar extends StatelessWidget {
  final String initials;
  final String initialsBgColors;

  InitialsAvatar({required this.initials, required this.initialsBgColors});

  @override
  Widget build(BuildContext context) {
    
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
