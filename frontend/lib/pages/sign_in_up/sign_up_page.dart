import 'dart:io'; // For File
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:frontend/api/backend.dart';
import 'package:frontend/components/gender_dropdown.dart';
import 'package:frontend/components/image_picker.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/components.dart';
import 'package:frontend/utils/utils.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';


class SignUpPage extends StatefulWidget {
  static const routeName = '/sign-up';
  final L10n l10n;
  final StorageService storageService;

  SignUpPage({required this.l10n, required this.storageService});

  @override
  SignUpPageState createState() => SignUpPageState();
}

class SignUpPageState extends State<SignUpPage> {
  bool _isSignUpApiSent = false;
  final _formKey = GlobalKey<FormState>();
  final DateFormat _dateFormat = DateFormat(dateFormat);
  final TextEditingController _birthdayController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _passwordRepeatedController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  XFile? _selectedImage;
  String initials = "";
  String initialsBgColor = getRandomHexColor();
  String? _errorMessage;
  String? _selectedGender;

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
      locale: Localizations.localeOf(context), // Add localization
    );
    if (picked != null) {
      logInfo("picked");
      logInfo(picked);
      logInfo(picked.toString());
      setState(() {
        _birthdayController.text = _dateFormat.format(picked);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    initials = getInitials(_lastNameController.text, _firstNameController.text);
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.l10n.translate("Sign Up", Localizations.localeOf(context).languageCode)),
        actions: [
          renderLanguagesIcon(widget.l10n, widget.storageService, context),
        ],
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: SizedBox(
                width: 400,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Show error message if present
                    if (_errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Text(
                          widget.l10n.translate(_errorMessage!, Localizations.localeOf(context).languageCode),
                          style: TextStyle(color: Colors.red),
                        ),
                      ),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: ImagePickerWidget(
                          initials: initials,
                          initialsBgColor: initialsBgColor,
                          labelText: widget.l10n.translate(_selectedImage == null ? "Select Profile Image" : "Change Profile Image", Localizations.localeOf(context).languageCode),
                          labelTextCamera: widget.l10n.translate(_selectedImage == null ? "Take photo" : "Change photo", Localizations.localeOf(context).languageCode),
                          onImageSelected: (XFile? image) {
                            setState(() {
                              _selectedImage = image;
                            });
                          },
                        ),
                      ),
                    TextFormField(
                      controller: _lastNameController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Last name", Localizations.localeOf(context).languageCode)),
                      onChanged: (value) {
                        setState(() {
                          initials = getInitials(value, _firstNameController.text);
                        });
                      },
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your last name", Localizations.localeOf(context).languageCode);
                        }
                        if (!nameRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Last name can only contain alphabetic characters, hyphens, or apostrophes", Localizations.localeOf(context).languageCode);
                        }
                        return null;
                      },
                    ),
                    TextFormField(
                      controller: _firstNameController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("First name", Localizations.localeOf(context).languageCode)),
                      onChanged: (value) {
                        setState(() {
                          initials = getInitials(_lastNameController.text, value);
                        });
                      },
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your first name", Localizations.localeOf(context).languageCode);
                        }
                        if (!nameRegExp.hasMatch(value)) {
                          return widget.l10n.translate("First name can only contain alphabetic characters, hyphens, or apostrophes", Localizations.localeOf(context).languageCode);
                        }
                        return null;
                      },
                    ),
                    TextFormField(
                      controller: _birthdayController,
                      decoration: InputDecoration(
                        labelText: widget.l10n.translate("Birthday", Localizations.localeOf(context).languageCode),
                        hintText: dateFormatLabel,
                        suffixIcon: Icon(Icons.calendar_today),
                      ),
                      readOnly: true,
                      onTap: () => _selectDate(context),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please select your birthday", Localizations.localeOf(context).languageCode);
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 20),
                    GenderDropdown(
                      l10n: widget.l10n,
                      initialGender: _selectedGender,
                      onChanged: (String? gender) {
                        setState(() {
                          _selectedGender = gender;
                        });
                      },
                    ),
                    TextFormField(
                      controller: _emailController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Email", Localizations.localeOf(context).languageCode)),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your email", Localizations.localeOf(context).languageCode);
                        }
                        if (!emailRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Please enter a valid email address", Localizations.localeOf(context).languageCode);
                        }
                        return null;
                      },
                    ),
                    // Email or username text field
                    TextFormField(
                      controller: _usernameController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Username", Localizations.localeOf(context).languageCode)),
                      validator: (value) {
                        if(value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your username", Localizations.localeOf(context).languageCode);
                        }
                        if(!letterStartRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Username must start with a letter.", Localizations.localeOf(context).languageCode);
                        }
                        else if(!alphNumUnderscoreRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Username can only contain letters, numbers, and underscores.", Localizations.localeOf(context).languageCode);
                        }
                        else if(value.length < 3 || value.length > 20) {
                          return widget.l10n.translate("Username must be between 3 and 20 characters long.", Localizations.localeOf(context).languageCode);
                        }
                        return null;
                      },
                    ),
                    TextFormField(
                      controller: _passwordController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Password", Localizations.localeOf(context).languageCode)),
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your password", Localizations.localeOf(context).languageCode);
                        }
                        else if(value.length < 8) {
                          return widget.l10n.translate("Password length must be greater than or equal to 8", Localizations.localeOf(context).languageCode);
                        }
                        else if (_passwordRepeatedController.text.isNotEmpty && value != _passwordRepeatedController.text) {
                          return widget.l10n.translate("The two passwords do not match", Localizations.localeOf(context).languageCode);
                        }
                        return null;
                      },
                    ),
                    TextFormField(
                      controller: _passwordRepeatedController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Re-enter your password", Localizations.localeOf(context).languageCode)),
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please re-enter your password", Localizations.localeOf(context).languageCode);
                        }
                        else if(value.length < 8) {
                          return widget.l10n.translate("Password length must be greater than or equal to 8", Localizations.localeOf(context).languageCode);
                        }
                        else if (_passwordController.text.isNotEmpty && value != _passwordController.text) {
                          return widget.l10n.translate("The two passwords do not match", Localizations.localeOf(context).languageCode);
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 20),
                    Container(
                      margin: EdgeInsets.only(bottom: 100),  // Add margin bottom here
                      child: ElevatedButton(
                        onPressed: _isSignUpApiSent ? null : () {
                          if (_formKey.currentState!.validate()) {
                            // Perform the sign-up logic
                            signUpUser(widget.storageService, Localizations.localeOf(context).languageCode);
                          }
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (_isSignUpApiSent)
                              Padding(
                                padding: const EdgeInsets.only(right: 8.0),
                                child: SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    strokeWidth: 2.0,
                                  ),
                                ),
                              ),
                            Text(widget.l10n.translate("Sign Up", Localizations.localeOf(context).languageCode)),
                          ]
                        )
                      )
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void signUpUser(StorageService storageService, String currentLanguage, {Dio? dio}) async {
    // Add your sign-up logic here, such as an HTTP request to your backend.
    final birthday = _birthdayController.text;
    final firsName = _firstNameController.text;
    final lastName = _lastNameController.text;
    final email = _emailController.text;
    final password = _passwordController.text;
    final username = _usernameController.text;


    setState(() {
      _isSignUpApiSent = true;
    });
    final dynamic data = {
      "birthday": birthday,
      "email": email,
      "first_name": firsName,
      "gender": _selectedGender,
      "image_url": "",
      "initials_bg_color": initialsBgColor,
      "last_name": lastName,
      "selected_language": currentLanguage,
      "password": password,
      "username": username,
    };
    if (_selectedImage != null) {
      try{
        String imageUrl = await uploadImage(_selectedImage!);
        data["image_url"] = imageUrl;
      }
      catch(er){
        logInfo(er);
      }
    }
    logInfo("data:");
    logInfo(data);

    dio ??= Dio(); // Use default client if none is provided
    try {
      final response = await ApiBackendService.signInUser(data: data, dio: dio);

      // Assuming the response contains the user session data
      if(response["success"] && response["user"] != null){
        setState(() {
          _errorMessage = null;  // Clear the error message on successful sign-in
          _isSignUpApiSent = false;
        });
        widget.storageService.set(key: 'user_session', obj: response["user"], updateNotifier: true);
      }
      else if(!response["success"] && response["message"] != null){
        setState(() {
          _errorMessage = response["message"];  // Set the error message on unsuccessful sign-in
          _isSignUpApiSent = false;
        });
        logInfo('Sign-in error: ${response["message"]}');
      }
      else{
        setState(() {
          _errorMessage = "An error occurred when log in!";  // Set the error message on unsuccessful sign-in
          _isSignUpApiSent = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "An error occurred when log in!";  // Set the error message on unsuccessful sign-in
          _isSignUpApiSent = false;
      });
      // Handle any errors that occurred during the HTTP request
      logInfo('Sign-in error: $e');
    }
    // Here you would send the data to your backend server
  }



  @override
  void dispose() {
    _birthdayController.dispose();
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _passwordController.dispose();
    _passwordRepeatedController.dispose();
    _usernameController.dispose();
    super.dispose();
  }
}
