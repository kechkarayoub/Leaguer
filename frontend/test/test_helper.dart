// ignore_for_file: unnecessary_no_such_method

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/widgets.dart';
import 'package:mockito/mockito.dart';
import 'package:frontend/l10n/l10n.dart'; 

// --- Fake HTTP Classes to simulate NetworkImage loading ---

class FakeSlowHttpClientResponse extends Fake implements HttpClientResponse {
  final List<int> _dummyPng = List<int>.filled(200, 0); // Simulated large image

  @override
  int get statusCode => 200;

  @override
  int get contentLength => _dummyPng.length;

  @override
  HttpClientResponseCompressionState get compressionState =>
      HttpClientResponseCompressionState.notCompressed;

  @override
  StreamSubscription<List<int>> listen(void Function(List<int>)? onData,
      {bool? cancelOnError, void Function()? onDone, Function? onError}) {
    
    const int chunkCount = 4; // Simulate 4 loading steps (25%, 50%, 75%, 100%)
    final int chunkSize = (_dummyPng.length / chunkCount).ceil();
    
    List<List<int>> chunks = [];
    for (int i = 0; i < chunkCount; i++) {
      int start = i * chunkSize;
      int end = (i + 1) * chunkSize;
      if (end > _dummyPng.length) end = _dummyPng.length;
      chunks.add(_dummyPng.sublist(start, end));
    }

    StreamController<List<int>> controller = StreamController<List<int>>();

    Future<void> emitChunks() async {
      for (int i = 0; i < chunks.length; i++) {
        await Future.delayed(const Duration(milliseconds: 100)); // Simulate delay
        controller.add(chunks[i]); // Emit partial data
      }
      controller.close();
    }

    emitChunks(); // Start emitting chunks asynchronously

    return controller.stream.listen(
      onData,
      cancelOnError: cancelOnError ?? false,
      onDone: onDone,
      onError: onError,
    );
  }

  @override
  Future<E> drain<E>([E? futureValue]) {
    return Future<E>.value(futureValue as E);
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}


class FakeHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return FakeHttpClient();
  }
}

class FakeHttpClient extends Fake implements HttpClient {
  @override
  bool autoUncompress = true;  // Required by Flutter's Image.network

  @override
  Future<HttpClientRequest> getUrl(Uri url) async {
    // If the URL contains 'slow_image', simulate a slow response.
    if (url.toString().contains("slow_image")) {
      return FakeHttpClientRequest(error: false, useSlowResponse: true);
    }
    // Simulate a network error if the URL contains 'invalid-url.com'
    if (url.toString().contains("invalid-url.com")) {
      return FakeHttpClientRequest(error: true);
    }
    return FakeHttpClientRequest();
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeHttpClientRequest extends Fake implements HttpClientRequest {
  final bool error;
  final bool useSlowResponse;
  FakeHttpClientRequest({this.error = false, this.useSlowResponse = false});

  @override
  Future<HttpClientResponse> close() async {
    if (error) {
      return FakeErrorHttpClientResponse();
    }
    if (useSlowResponse) {
      return FakeSlowHttpClientResponse();
    }
    return FakeHttpClientResponse();
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeErrorHttpClientResponse extends Fake implements HttpClientResponse {
  @override
  int get statusCode => 404; // Non-success status code

  @override
  int get contentLength => 0;

  @override
  HttpClientResponseCompressionState get compressionState => HttpClientResponseCompressionState.notCompressed;

  @override
  StreamSubscription<List<int>> listen(void Function(List<int>)? onData,
      {bool? cancelOnError, void Function()? onDone, Function? onError}) {
    // Return an empty stream to simulate error
    return Stream<List<int>>.empty().listen(
      onData,
      cancelOnError: cancelOnError ?? false,
      onDone: onDone,
      onError: onError,
    );
  }

  // Override drain to return a Future<List<int>>.
  @override
  Future<E> drain<E>([E? futureValue]) {
    if (E == List<int>) {
      // If futureValue is null, use an empty list as the default.
      return Future<E>.value((futureValue ?? <int>[]) as E);
    }
    return Future<E>.value(futureValue as E);
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}


class FakeHttpClientResponse extends Fake implements HttpClientResponse {
  // A 1x1 transparent PNG image encoded in Base64
  final List<int> _dummyPng = base64Decode(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ/wP+Fo5IEQAAAABJRU5ErkJggg==");

  @override
  int get statusCode => 200;

  @override
  int get contentLength => _dummyPng.length;


  @override
  HttpClientResponseCompressionState get compressionState => HttpClientResponseCompressionState.notCompressed;


  @override
  StreamSubscription<List<int>> listen(void Function(List<int>)? onData,
      {bool? cancelOnError, void Function()? onDone, Function? onError}) {
    return Stream<List<int>>.fromIterable([_dummyPng]).listen(
      onData,
      cancelOnError: cancelOnError ?? false,
      onDone: onDone,
      onError: onError,
    );
  }

  @override
  Future<E> drain<E>([E? futureValue]) {
    return Future<E>.value(futureValue as E);
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

// --- End of Fake HTTP Classes ---



// Mock BuildContext
class MockBuildContext extends Mock implements BuildContext {}


class MockL10n implements L10n {
  @override
  List<Locale> get supportedLocales => [
        Locale('en'),
        Locale('ar'),
        Locale('fr'),
      ];

  @override
  Future<void> loadTranslations() async {
    // Mock implementation does nothing (since no real loading is needed in tests).
  }
  @override
  String translate(String key, [String? languageCode]) {
    final translations = {
      "Gender": {
        "ar": "الجنس",
        "en": "Gender",
        "fr": "Genre"
      },
      "female_gender": {
        "ar": "أنثى",
        "en": "Female",
        "fr": "Femme"
      },
      "male_gender": {
        "ar": "ذكر",
        "en": "Male",
        "fr": "Homme"
      },
      "Please select your gender": {
        "ar": "المرجو تحديد جنسك",
        "en": "Please select your gender",
        "fr": "Veuillez sélectionner votre genre"
      },
      "language_ar": {
        "ar": "العربية",
        "en": "Arabic",
        "fr": "Arabe"
      },
      "language_en": {
        "ar": "الإنجليزية",
        "en": "English",
        "fr": "Anglais"
      },
      "language_fr": {
        "ar": "الفرنسية",
        "en": "French",
        "fr": "Français"
      },
    };
    // Check if the language map exists, otherwise return the key.
    final languageMap = translations[key];
    if (languageMap == null) {
      return key; // Fallback to the key if no translation exists.
    }

    // Safely access the translation for the languageCode.
    return languageMap[languageCode] ?? key;
  }
  @override
  String translateFromContext(BuildContext context, String key) {
    // Since we don’t have a real BuildContext in tests, return a default translation
    return translate(key, 'en'); // Default to English for tests
  }
}

