import datetime
import requests
import yaml

import errno
from socket import error as socket_error

from django.conf import settings
from django.views.generic import View
from django.shortcuts import HttpResponse, render_to_response
from django.template import RequestContext
from django.template.loader import get_template

try:
    import simplejson as json
except ImportError:
    import json

from geosite.cache import provision_memcached_client
from geositeserver.utils import get_json_admin0


def home(request, template="geositeserver/home.html"):
    ctx = {}
    return render_to_response(template, RequestContext(request, ctx))

def explore(request, template="explore.html"):
    now = datetime.datetime.now()

    map_config = {
        "latitude": settings.SPARC_MAP_DEFAULTS.get("latitude", 0),
        "longitude": settings.SPARC_MAP_DEFAULTS.get("longitude", 0),
        "zoom": settings.SPARC_MAP_DEFAULTS.get("zoom", 0),
        "baselayers": settings.SPARC_MAP_DEFAULTS.get("baselayers", []),
    }
    ctx = {
        "map_config": json.dumps(map_config)
    }
    return render_to_response(template, RequestContext(request, ctx))

def about(request, template="about.html"):
    ctx = {}
    return render_to_response(template, RequestContext(request, ctx))

def download(request, template="download.html"):
    ctx = {}
    return render_to_response(template, RequestContext(request, ctx))

def country_detail(request, iso3=None, template="country_detail.html"):
    now = datetime.datetime.now()

    country_title = SPARCCountry.objects.get(country__thesaurus__iso3=iso3).dos_short

    map_config = {
        "latitude": settings.SPARC_MAP_DEFAULTS.get("latitude", 0),
        "longitude": settings.SPARC_MAP_DEFAULTS.get("longitude", 0),
        "zoom": settings.SPARC_MAP_DEFAULTS.get("zoom", 0),
        "baselayers": settings.SPARC_MAP_DEFAULTS.get("baselayers", []),
        "legend": {
            "colors": settings.SPARC_MAP_DEFAULTS["legend"]["colors"]
        }
    }
    ctx = {
        "iso3": iso3,
        "country_title": country_title,
        "map_config": json.dumps(map_config)
    }
    return render_to_response(template, RequestContext(request, ctx))


def wfp_facilities(request, template="geositeserver/map.html"):
    map_config_yml = get_template("geositeserver/maps/wfp_facilities.yml").render({})
    map_config = yaml.load(map_config_yml)

    ctx = {
        "state": {
            "view": {
                "latitude": map_config["view"]["latitude"],
                "longitude": map_config["view"]["longitude"],
                "zoom": map_config["view"]["zoom"]
            }
        },
        "map_config": map_config,
        "map_config_json": json.dumps(map_config)
    }

    return render_to_response(template, RequestContext(request, ctx))


class geosite_view(View):

    key = None
    content_type = "application/json"

    def _build_key(self, request, *args, **kwargs):
        return self.key

    def _build_data(self):
        raise Exception('geosite_view._build_data should be overwritten')

    def get(self, request, *args, **kwargs):
        data = None
        if settings.GEOSITE_CACHE_DATA:
            client = provision_memcached_client()
            if client:
                key = self._build_key(request, *args, **kwargs)
                print "Checking cache with key ", key

                data = None
                try:
                    data = client.get(key)
                except socket_error as serr:
                    data = None
                    print "Error getting data from in-memory cache."
                    if serr.errno == errno.ECONNREFUSED:
                        print "Memcached is likely not running.  Start memcached with supervisord."
                    raise serr

                if not data:
                    print "Data not found in cache."
                    data = self._build_data(request, *args, **kwargs)
                    try:
                        client.set(key, data)
                    except socket_error as serr:
                        print "Error saving data to in-memory cache."
                        if serr.errno == errno.ECONNREFUSED:
                            print "Memcached is likely not running or the data exceeds memcached item size limit.  Start memcached with supervisord."
                        raise serr
                else:
                    print "Data found in cache."
            else:
                print "Could not connect to memcached client.  Bypassing..."
                data = self._build_data(request, *args, **kwargs)
        else:
            print "Not caching data (settings.GEOSITE_CACHE_DATA set to False)."
            data = self._build_data(request, *args, **kwargs)
        return HttpResponse(json.dumps(data, default=jdefault), content_type=self.content_type)

class admin0_data(geosite_view):

    key = "data/local/admin0/json"

    def _build_data(self, request, *args, **kwargs):
        return get_json_admin0(request)


class data_local_country_admin(geosite_view):

    def _build_key(self, request, *args, **kwargs):
        return "data/local/country/{iso_alpha3}/admin/{level}/json".format(**kwargs)

    def _build_data(self, request, *args, **kwargs):
        print kwargs
        level = kwargs.pop('level', None)
        iso_alpha3 = kwargs.pop('iso_alpha3', None)
        data = None
        if int(level) == 2:
            data = get_geojson_admin2(request, iso_alpha3=iso_alpha3, level=level)
        return data


def cache_data_flush(request):
    client = provision_memcached_client()
    success = client.flush_all()
    return HttpResponse(json.dumps({'success':success}), content_type='application/json')


def jdefault(o):
    return o.__dict__
