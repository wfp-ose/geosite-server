import os

__version__ = (1, 0, 0, 'alpha', 0)

def get_version():
    import geositeserver.version
    return geositeserver.version.get_version(__version__)

def main(global_settings, **settings):
    from django.core.wsgi import get_wsgi_application
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings.get('django_settings'))
    app = get_wsgi_application()
    return app
