from __future__ import absolute_import
import os

import geositeserver


VERSION = geositeserver.get_version()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

SECRET_KEY = '9u$pbamv*a1s09(5grvnko2)n)isa50=uui@lm3syhp6)jyrhg'

DEBUG = True

FIXTURE_DIRS = ()

SERIALIZATION_MODULES = {
    'yml': "django.core.serializers.pyyaml"
}

#######################################
# TEMPLATES
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, "geositeserver/templates")
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'geositeserver.context_processors.geositeserver',
                'geosite.context_processors.geosite',
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
#######################################
# STATIC
DEBUG_STATIC = True
STATIC_ROOT = '/var/www/static/'
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "geositeserver/static"),
]
ALLOWED_HOSTS = []

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.gis',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'pinax_theme_bootstrap',
    'django_forms_bootstrap',

    'autocomplete_light',

    'leaflet',

    'corsheaders',
    'jquery',
    #'taggit',
    #'taggit_templatetags',
)

WFP_APPS = (
    'wfppresencedjango',
    'lsibdjango',
    'gauldjango',
    'geosite'
)

GEOSITE_SERVER_APPS = (
    'geositeserver',
)

INSTALLED_APPS = INSTALLED_APPS + WFP_APPS + GEOSITE_SERVER_APPS

MIDDLEWARE_CLASSES = (
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'geositeserver.urls'

WSGI_APPLICATION = 'geositeserver.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'geosite',
        'USER': 'geosite',
        'PASSWORD': 'geosite',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
#######################################
# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True
#######################################
SITEURL = "http://localhost:8000/"

CORS_ORIGIN_ALLOW_ALL = True

PROXY_ALLOWED_HOSTS = (
    'tile.openstreetmap.org',
    'tile.openstreetmap.fr',
    'tiles.virtualearth.net',
    'tiles.mapbox.com',
    'hiu-maps.net',
    'geonode.wfp.org',
    'geosite.wfp.org')

PROXY_URL = '/proxy/?url='

# Site id in the Django sites framework
SITE_ID = 1

#######################################
GEOSITE_DB_CONN_STR = "dbname='geosite' user='geosite' host='localhost' password='geosite'"
GEOSITE_CACHE_DATA = True
GEOSITE_MEMCACHED_HOST = 'localhost'
GEOSITE_MEMCACHED_PORT = 11212  # So doesn't interfer with root/built-in memcached
#-----------------------------
# DNS Prefetch
GEOSITE_DNS_PREFETCH = [
    '//wfp.org',
    '//mapbox.com', '//api.mapbox.com',
    '//thunderforest.com',
    '//openstreetmap.org', '//openstreetmap.fr'
]
#-----------------------------
# Dependencies Management
GEOSITE_SERVER_STATIC_VERSION="1.0.0"
GEOSITE_STATIC_VERSION="1.0.0"
GEOSITE_STATIC_DEPS = {
    "angular": {
        "version": "1.4.0-beta.4"
    },
    "c3": {
        "version": "0.4.10"
    },
    "d3": {
        "version": "3.5.14"
    },
    "fontawesome": {
        "version": "4.5.0"
    },
    "jquery": {
        "version": "1.9.1"
    },
    "jqueryui": {
        "version": "1.11.4",
        "theme": "cupertino"
    },
    "select2": {
        "version": "4.0.1"
    }
}
#-----------------------------
# Debugging & Testing
GEOSITE_SERVER_STATIC_DEBUG = {
    "main": True
}

GEOSITE_STATIC_DEBUG = {
    "polyfill": False,
    "main": True,
    "angular": False,
    "c3": False,
    "d3": False,
    "bootstrap": False,
    "jquery": False,
    "leaflet": True
}
#######################################
