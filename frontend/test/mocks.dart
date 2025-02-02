import 'package:dio/dio.dart';
// import 'package:frontend/l10n/l10n.dart';
import 'package:mockito/annotations.dart';
import 'package:frontend/storage/storage.dart'; // Adjust path as needed

@GenerateMocks([StorageService])
// Annotate the Dio class to generate a mock
@GenerateMocks([Dio])
// // Annotate the L10n class to generate a mock
// @GenerateMocks([L10n])
void main() {}
