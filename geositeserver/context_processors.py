from django.conf import settings
from django.contrib.sites.models import Site

try:
    import simplejson as json
except ImportError:
    import json

from geositeserver.models import GeositeMap

def geositeserver(request):
    """Global values to pass to templates"""
    site = Site.objects.get_current()
    defaults = dict(
        STATIC_URL=settings.STATIC_URL,
        VERSION="2.0.0",
        SITE_NAME=site.name,
        SITE_DOMAIN=site.domain,
        DEBUG_STATIC=getattr(
            settings,
            "DEBUG_STATIC",
            False),
        GEOSITE_SERVER_STATIC_VERSION=settings.GEOSITE_SERVER_STATIC_VERSION,
        GEOSITE_SERVER_STATIC_DEBUG=settings.GEOSITE_SERVER_STATIC_DEBUG,
        GEOSITE_DASHBOARDS_TYPEAHEAD=json.dumps([{'id': d.slug, 'text': d.title} for d in GeositeMap.objects.all().order_by('title')])
    )

    return defaults
