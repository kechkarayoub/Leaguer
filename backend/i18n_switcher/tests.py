# -*- coding: utf-8 -*-

from .templatetags.i18n_switcher import *
from django.http import HttpRequest
from django.test import TestCase


class I18nSwitcherTests(TestCase):
    def test_switch_lang_code(self):
        new_url = switch_lang_code("/fr/admin/", "fr")
        self.assertEqual("/fr/admin/", new_url)
        new_url = switch_lang_code("/fr/admin/", "ar")
        self.assertEqual("/ar/admin/", new_url)
        new_url = switch_lang_code("/admin/", "ar")
        self.assertEqual("/ar/admin/", new_url)
        self.assertRaises(Exception, switch_lang_code, "", "en")
        self.assertRaises(Exception, switch_lang_code, "ar/admin/", "ar")
        self.assertRaises(Exception, switch_lang_code, "/ar/admin/", "es")

    def test_switch_i18n_prefix(self):
        new_url = switch_i18n_prefix("/fr/admin/", "fr")
        self.assertEqual("/fr/admin/", new_url)
        new_url = switch_i18n_prefix("/fr/admin/", "ar")
        self.assertEqual("/ar/admin/", new_url)
        new_url = switch_i18n_prefix("/admin/", "ar")
        self.assertEqual("/ar/admin/", new_url)
        self.assertRaises(Exception, switch_i18n_prefix, "", "en")
        self.assertRaises(Exception, switch_i18n_prefix, "ar/admin/", "ar")
        self.assertRaises(Exception, switch_i18n_prefix, "/ar/admin/", "es")

    def test_switch_i18n(self):
        request = HttpRequest()
        request.method = 'GET'
        request.path = "/fr/admin/"
        new_url = switch_i18n(request, "fr")
        self.assertEqual("/fr/admin/", new_url)
        request.path = "/fr/admin/"
        new_url = switch_i18n(request, "ar")
        self.assertEqual("/ar/admin/", new_url)
        request.path = "/admin/"
        new_url = switch_i18n(request, "ar")
        self.assertEqual("/ar/admin/", new_url)
        request.path = ""
        self.assertRaises(Exception, switch_i18n, request, "en")
        request.path = "ar/admin/"
        self.assertRaises(Exception, switch_i18n, request, "ar")
        request.path = "/fr/admin/"
        self.assertRaises(Exception, switch_i18n, request, "es")

