import errno
import psycopg2

from socket import error as socket_error
from jenks import jenks

from django.conf import settings
from django.template.loader import get_template

from geosite.enumerations import MONTHS_SHORT3

from geosite.cache import provision_memcached_client
