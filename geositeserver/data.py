import errno
import psycopg2

from socket import error as socket_error
from jenks import jenks

from django.conf import settings
from django.template.loader import get_template

from geosite.enumerations import MONTHS_SHORT3

from geosite.cache import provision_memcached_client
from geosite.data import data_local_country

class data_local_country_admin(data_local_country):

    key = None

    def _build_key(self, *args, **kwargs):
        return "data/local/country/{iso_alpha3}/admin/{level}/geojson".format(**kwargs)

    def _build_data(self, *args, **kwargs):
        cursor = kwargs.get('cursor', None)
        iso_alpha3 = kwargs.get('iso_alpha3', None)
        level = kwargs.get('level', None)
        results = None
        if level == 2:
            q = get_template("geositeserver/sql/_admin2_polygons.sql").render({
                'tolerance': '.01',
                'iso_alpha3': iso_alpha3})
            cursor.execute(q)
            res = cursor.fetchone()
            results = json.loads(res[0]) if (type(res[0]) is not dict) else res[0]
        return results
