from django.contrib import admin

from geositeserver.models import *

class GeositeMapAdmin(admin.ModelAdmin):
    model = GeositeMap
    list_display_links = ('id', 'title',)
    list_display = ('id', 'title', 'slug', 'template', )

admin.site.register(GeositeMap, GeositeMapAdmin)
