from django import VERSION
from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.views.i18n import javascript_catalog
from django.views.generic import TemplateView

from . import views

admin.autodiscover()

js_info_dict = {
    'domain': 'djangojs',
    'packages': ('geositeserver',)
}

sitemaps = {
}

urlpatterns = [
    # Web Pages
    url(
        r'^$',
        views.explore,
        name='home'),
    url(
        r'^explore$',
        views.explore,
        name='explore'),
    url(
        r'^dashboard/(?P<slug>[^/]+)$',
        views.geosite_dashboard,
        name='geosite_dashboard'),

    # JSON Services
    url(
        r'^map-schema[.]json$',
        views.geosite_map_schema,
        name='geosite_map_schema'),

    url(
        r'^map/(?P<slug>[^/]+)/config[.]json$',
        views.geosite_map_config,
        name='geosite_map_config'),

    url(
        r'^editor/config[.]json$',
        views.geosite_editor_config,
        name='geosite_editor_config'),

    # Cache control
    url(
        r'^cache/data/flush$',
        views.cache_data_flush,
        name='cache_data_flush'),

    # Django urls
    url(
        r'^sitemap\.xml$',
        sitemap,
        {'sitemaps': sitemaps},
        name='sitemap'),
    url(
        r'^lang\.js$',
        TemplateView.as_view(template_name='lang.js', content_type='text/javascript'),
        name='lang'),
    url(r'^jsi18n/$', javascript_catalog, js_info_dict, name='jscat'),
    url(r'^i18n/', include('django.conf.urls.i18n')),
    url(r'^autocomplete/', include('autocomplete_light.urls')),
    # Admin URLS Specific @ https://github.com/django/django/blob/master/django/contrib/admin/sites.py#L270
    url(r'^admin/', include(admin.site.urls)),
]

if VERSION < (1, 9):
    urlpatterns = patterns('', *urlpatterns)
